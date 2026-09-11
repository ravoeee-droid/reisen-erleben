const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const root=__dirname,out=path.join(root,'dist');
if(!fs.existsSync(out)) throw new Error('dist missing — run V3/V4 build first');
const bundleDir=path.join(root,'.v5-src');
const parts=fs.readdirSync(bundleDir).filter(n=>/^part-\d+\.b64$/.test(n)).sort();
if(!parts.length) throw new Error('STOP-SHIP: V5 source parts missing');
const encoded=parts.map(n=>fs.readFileSync(path.join(bundleDir,n),'utf8')).join('').trim();
const compressed=Buffer.from(encoded,'base64');
const expected=fs.readFileSync(path.join(bundleDir,'checksum.txt'),'utf8').trim();
const actual=crypto.createHash('sha256').update(compressed).digest('hex');
if(actual!==expected) throw new Error(`STOP-SHIP: V5 source checksum mismatch: ${actual}`);
const src=JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));
if(!src['v5-entry.js']||!src['v5.css']) throw new Error('STOP-SHIP: V5 source payload incomplete');
const assets=path.join(out,'assets');fs.mkdirSync(assets,{recursive:true});
fs.writeFileSync(path.join(assets,'v5.css'),src['v5.css'],'utf8');
let js=src['v5-entry.js'];
js=js.replace(/^import Lenis from ['"]lenis['"];\s*/m,'')
     .replace(/^import \{ gsap \} from ['"]gsap['"];\s*/m,'')
     .replace(/^import \{ ScrollTrigger \} from ['"]gsap\/ScrollTrigger['"];\s*/m,'')
     .replace(/^gsap\.registerPlugin\(ScrollTrigger\);\s*/m,'');
js=`(()=>{const Lenis=window.Lenis,gsap=window.gsap,ScrollTrigger=window.ScrollTrigger;if(gsap&&ScrollTrigger)gsap.registerPlugin(ScrollTrigger);\n${js}\n})();`;
fs.writeFileSync(path.join(assets,'v5.js'),js,'utf8');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const htmlFiles=walk(out).filter(f=>f.endsWith('.html'));
const currentImageMap=new Map([
 ['P0021_2024018_NOLTE_MOTORRAD_REISEN%26ERLEBEN_ALBANIEN_2409-878_extended.jpg','CAR60003.jpg'],['slider_IMG_3731.jpg','CAR60596.jpg'],['slider_gruppe-2.jpg','CAR60685.jpg'],['slider_IMG_4051.jpg','CAR60714.jpg'],['P0021_2024018_NOLTE_MOTORRAD_REISEN%26ERLEBEN_VOGESEN_2405-35_extended.jpg','CAR60882.jpg'],['slider_IMG_4055.jpg','CAR61568.jpg'],['slider_IMG_4258.jpg','CAR61693.jpg'],['slider_IMG_4282.jpg','CAR61909.jpg'],['slider_bruecke.jpg','CAR62119.jpg'],['slider_fotograf.jpg','CAR62349.jpg'],['slider_trentino.jpg','CAR65213.jpg'],['3aa0c948-c534-4cc2-982c-012afa0c43d4.jpg','CAR65299.jpg'],['slider_see.jpg','CAR66074.jpg']
]);
function proxyImage(url){try{const u=new URL(url.replaceAll('&amp;','&'));const name=decodeURIComponent(u.pathname.split('/').pop()||'');const mapped=currentImageMap.get(name)||currentImageMap.get(encodeURIComponent(name))||name;if(mapped!==name)u.pathname='/images/slideshow/'+mapped;u.protocol='https:';u.hostname='www.reisenunderleben.net';return '/api/re-image?src='+encodeURIComponent(u.toString());}catch{return url;}}
const vendor=`<script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script><script defer src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script><script defer src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js"></script>`;
for(const file of htmlFiles){let s=fs.readFileSync(file,'utf8');
  s=s.replace(/<script[^>]+src=["']\/assets\/(?:v4|tobi|v5)\.js["'][^>]*><\/script>/gi,'').replace(/<link[^>]+href=[#']\/assets\/v5\.css[#'][^>]*>/gi,'');
  s=s.replace(/<script[^>]+src=["']https:\/\/(?:cdn\.jsdelivr\.net\/npm\/gsap|unpkg\.com\/lenis)[^"']*["'][^>]*><\/script>/gi,'');
  s=s.replace(/https:\/\/(?:www\.)?reisenunderleben\.net\/images\/[^"'\s)<>]+/gi,m=>proxyImage(m));
  let heroDone=false;
  s=s.replace(/<img\b([^>]*?)>/gi,(tag,attrs,offset)=>{if(/class=["'][^"']*brand/i.test(tag)||/logo/i.test(tag))return tag;const near=s.slice(Math.max(0,offset-500),offset);if(!heroDone&&/hero/i.test(near)){heroDone=true;let t=tag.replace(/\sloading=[#'][^"']*["']/i,'').replace(/\sfetchpriority=["'][^"']*["']/i,'');return t.replace(/>$/,' loading="eager" fetchpriority="high" decoding="async">');}if(!/\sloading=/.test(tag))return tag.replace(/>$/,' loading="lazy" decoding="async">');return tag;});
  s=s.replace('</head>','<link rel="stylesheet" href="/assets/v5.css"></head>').replace('</body>',`${vendor}<script defer src="/assets/v5.js"></script></body>`);
  fs.writeFileSync(file,s,'utf8');
}
const outputHtml=htmlFiles.map(f=>fs.readFileSync(f,'utf8')).join('\n');
if(/<script[^>]+src=["']\/assets\/(?:v4|tobi)\.js["']/i.test(outputHtml))throw new Error('STOP-SHIP: old V4 JS runtime still present');
if(!outputHtml.includes('/assets/v5.js')||!outputHtml.includes('/assets/v5.css'))throw new Error('STOP-SHIP: V5 assets missing');
if(/<img\b[^>]*src=["']https:\/\/(?:www\.)?reisenunderleben\.net\/images\//i.test(outputHtml))throw new Error('STOP-SHIP: direct R&E image hotlink remains');
if(!outputHtml.includes('cdn.jsdelivr.net/npm/gsap@3.15.0')||!outputHtml.includes('unpkg.com/lenis@1.3.26'))throw new Error('STOP-SHIP: motion runtime tags missing');
if(!fs.existsSync(path.join(assets,'v5.js'))||fs.statSync(path.join(assets,'v5.js')).size<5000)throw new Error('STOP-SHIP: V5 runtime invalid');
console.log(`R&E V5 applied: ${htmlFiles.length} HTML pages, no build-time bundler, release gates passed`);
