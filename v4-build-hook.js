const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const root=__dirname;
const out=path.join(root,'dist');
const bundleDir=path.join(root,'.v4-runtime');
if(!fs.existsSync(out)) throw new Error('dist missing — run the V3 build first');
const parts=fs.readdirSync(bundleDir).filter(n=>/^part-\d+\.b64$/.test(n)).sort();
if(!parts.length) throw new Error('V4 runtime bundle missing');
const encoded=parts.map(n=>fs.readFileSync(path.join(bundleDir,n),'utf8')).join('').trim();
const compressed=Buffer.from(encoded,'base64');
const expected=fs.readFileSync(path.join(bundleDir,'checksum.txt'),'utf8').trim();
const actual=crypto.createHash('sha256').update(compressed).digest('hex');
if(actual!==expected) throw new Error(`V4 runtime checksum mismatch: expected ${expected}, got ${actual}`);
const runtime=JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));
for(const [rel,content] of Object.entries(runtime)){
  if(rel.includes('..')||path.isAbsolute(rel)) throw new Error(`Unsafe V4 output path: ${rel}`);
  const target=path.join(out,rel);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,content,'utf8');
}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const html=walk(out).filter(f=>f.endsWith('.html'));
for(const file of html){
  let s=fs.readFileSync(file,'utf8');
  if(!s.includes('/assets/v4.css')) s=s.replace('</head>','<link rel="stylesheet" href="/assets/v4.css"></head>');
  if(!s.includes('/assets/v4.js')) s=s.replace('</body>','<script defer src="/assets/v4.js"></script><script defer src="/assets/tobi.js"></script></body>');
  fs.writeFileSync(file,s,'utf8');
}
console.log(`R&E V4 applied: ${Object.keys(runtime).length} runtime assets, ${html.length} HTML pages patched`);
