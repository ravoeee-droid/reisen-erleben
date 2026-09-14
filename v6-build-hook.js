const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const out = path.join(root, 'dist');
const assets = path.join(out, 'assets');
const mediaOut = path.join(assets, 'media');
const REMOTE_HOSTS = new Set(['www.reisenunderleben.net', 'reisenunderleben.net']);
const HERO_REMOTE = 'https://www.reisenunderleben.net/images/slideshow/CAR60003.jpg';
const proxyFor = url => `/api/re-image?src=${encodeURIComponent(url)}`;

if (!fs.existsSync(out)) throw new Error('STOP-SHIP: dist missing before V6 pass');
fs.mkdirSync(assets, {recursive:true});
fs.mkdirSync(mediaOut, {recursive:true});
fs.copyFileSync(path.join(root,'v6-entry.js'), path.join(assets,'v6.js'));
fs.copyFileSync(path.join(root,'v6.css'), path.join(assets,'v6.css'));

let sharp = null;
try { sharp = require('sharp'); } catch { console.warn('[V6] sharp unavailable — media will be localised without resize.'); }

function htmlFiles(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => {
    const p=path.join(dir,entry.name);
    return entry.isDirectory() ? htmlFiles(p) : (entry.isFile() && entry.name.endsWith('.html') ? [p] : []);
  });
}
function decodeProxy(raw) {
  try {
    const decoded = raw.replaceAll('&amp;','&');
    const m = decoded.match(/^\/api\/re-image\?src=([^"'\s<>]+)/);
    if (!m) return null;
    const u = new URL(decodeURIComponent(m[1]));
    if (u.protocol !== 'https:' || !REMOTE_HOSTS.has(u.hostname)) return null;
    return u.href;
  } catch { return null; }
}
function collectRemote(html) {
  const set = new Set([HERO_REMOTE]);
  const rx = /\/api\/re-image\?src=[^"'\s<>]+/g;
  for (const raw of html.match(rx) || []) { const u=decodeProxy(raw); if(u) set.add(u); }
  return [...set];
}
async function fetchBytes(url) {
  let lastError;
  for (let attempt=1; attempt<=2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 15000);
    try {
      const res = await fetch(url,{signal:ctrl.signal,headers:{'user-agent':'Mozilla/5.0 Reisen-Erleben-V6-Build/1.0','accept':'image/avif,image/webp,image/jpeg,image/*,*/*;q=.8'}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const type=(res.headers.get('content-type')||'').toLowerCase();
      if(!type.startsWith('image/')) throw new Error(`not image (${type})`);
      const buf=Buffer.from(await res.arrayBuffer());
      if(buf.length<4096) throw new Error(`image too small (${buf.length})`);
      return buf;
    } catch (err) {
      lastError = err;
      if (attempt < 2) await new Promise(r=>setTimeout(r, 350));
    } finally { clearTimeout(timer); }
  }
  throw lastError;
}
async function localise(url) {
  if (process.env.RE_V6_OFFLINE === '1') return null;
  try {
    let buf=await fetchBytes(url); let ext='.jpg';
    if(sharp){
      const hero=url===HERO_REMOTE;
      buf=await sharp(buf,{failOn:'none'}).rotate().resize({width:hero?1920:1600,height:hero?1280:1200,fit:'inside',withoutEnlargement:true}).webp({quality:hero?82:78,effort:4,smartSubsample:true}).toBuffer();
      ext='.webp';
    }
    const id=crypto.createHash('sha1').update(buf).digest('hex').slice(0,14);
    const name=`re-${id}${ext}`;
    fs.writeFileSync(path.join(mediaOut,name),buf);
    return `/assets/media/${name}`;
  } catch (err) {
    console.warn(`[V6] media fallback ${url}: ${err.message}`);
    return null;
  }
}
async function mapLimit(items, limit, worker) {
  const result=new Map(); let index=0;
  async function runner(){
    while(index<items.length){ const i=index++; const item=items[i]; result.set(item,await worker(item)); }
  }
  await Promise.all(Array.from({length:Math.min(limit,items.length)},runner));
  return result;
}
function stripHeavyRuntime(html) {
  return html
    .replace(/<script\b[^>]*src=["'][^"']*(?:gsap(?:\.min)?\.js|ScrollTrigger(?:\.min)?\.js|lenis(?:\.min)?\.js)[^"']*["'][^>]*><\/script>/gi,'')
    .replace(/<script\b[^>]*src=["']\/assets\/v5\.js["'][^>]*><\/script>/gi,'')
    .replace(/<link\b[^>]*href=["']\/assets\/v6\.css["'][^>]*>/gi,'')
    .replace(/<script\b[^>]*src=["']\/assets\/v6\.js["'][^>]*><\/script>/gi,'');
}
function addV6(html) {
  html=html.replace('</head>','<link rel="stylesheet" href="/assets/v6.css"></head>');
  html=html.replace('</body>','<script defer src="/assets/v6.js"></script></body>');
  return html;
}
function replaceMedia(html,map){
  const rx=/\/api\/re-image\?src=[^"'\s<>]+/g;
  return html.replace(rx,raw=>{const remote=decodeProxy(raw); return (remote&&map.get(remote))||raw;});
}
function patchHero(html,heroSrc){
  const start=html.indexOf('<section class="hero"');
  if(start<0) return html;
  const media=html.indexOf('<div class="hero-media"',start);
  const mediaEnd=html.indexOf('</div>',media);
  if(media<0||mediaEnd<0) return html;
  const block=html.slice(media,mediaEnd+6);
  const fixed=block.replace(/<img\b[^>]*>/i,tag=>{
    let t=tag.replace(/\bsrc=["'][^"']*["']/i,`src="${heroSrc}"`);
    t=t.replace(/\bloading=["'][^"']*["']/i,'').replace(/\bdecoding=["'][^"']*["']/i,'').replace(/\bfetchpriority=["'][^"']*["']/i,'');
    return t.replace(/>$/, ' loading="eager" decoding="async" fetchpriority="high">');
  });
  html=html.slice(0,media)+fixed+html.slice(mediaEnd+6);
  if(!html.includes(`rel="preload" as="image" href="${heroSrc}"`)) html=html.replace('</head>',`<link rel="preload" as="image" href="${heroSrc}" fetchpriority="high"></head>`);
  return html;
}
function tuneImages(html){
  return html.replace(/<img\b([^>]*)>/gi,(tag,attrs)=>{
    if(/(?:src|class|alt)=["'][^"']*(?:logo|brand|Reisen & Erleben)/i.test(tag) || /fetchpriority=["']high/i.test(tag)) return tag;
    let t=tag;
    if(!/\bloading=/i.test(t)) t=t.replace(/>$/,' loading="lazy">');
    if(!/\bdecoding=/i.test(t)) t=t.replace(/>$/,' decoding="async">');
    return t;
  });
}

(async()=>{
  const files=htmlFiles(out);
  const snapshots=files.map(file=>({file,html:fs.readFileSync(file,'utf8')}));
  const remotes=[...new Set(snapshots.flatMap(x=>collectRemote(x.html)))];
  console.log(`[V6] localising ${remotes.length} unique R&E media assets…`);
  const map=await mapLimit(remotes,4,localise);
  if (process.env.RE_V6_OFFLINE !== '1' && !map.get(HERO_REMOTE)) throw new Error('STOP-SHIP: critical hero could not be localised');
  const heroSrc=map.get(HERO_REMOTE)||proxyFor(HERO_REMOTE);
  for(const {file,html:original} of snapshots){
    let html=stripHeavyRuntime(original);
    html=replaceMedia(html,map);
    if(path.resolve(file)===path.resolve(path.join(out,'index.html'))) html=patchHero(html,heroSrc);
    html=tuneImages(html);
    html=addV6(html);
    fs.writeFileSync(file,html,'utf8');
  }
  const ok=[...map.values()].filter(Boolean).length;
  const failed=remotes.filter(url=>!map.get(url));
  fs.writeFileSync(path.join(out,'v6-build-report.json'),JSON.stringify({version:'6.0.0',htmlFiles:files.length,mediaTotal:remotes.length,mediaLocalised:ok,mediaFallbacks:failed,hero:heroSrc,legacyRuntimeRemoved:true},null,2));
  console.log(`[V6] complete: ${ok}/${remotes.length} media localised; hero=${heroSrc}; ${files.length} HTML files patched.`);
})().catch(err=>{console.error(err);process.exit(1)});
