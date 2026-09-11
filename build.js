const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const root=__dirname;
const out=path.join(root,'dist');
const bundleDir=path.join(root,'.site-bundle');
const chunks=fs.readdirSync(bundleDir).filter(n=>/^part-\d+\.b64$/.test(n)).sort();
if(!chunks.length) throw new Error('No site bundle chunks found');
const encoded=chunks.map(n=>fs.readFileSync(path.join(bundleDir,n),'utf8').trim()).join('');
const compressed=Buffer.from(encoded,'base64');
const expected=fs.readFileSync(path.join(bundleDir,'checksum.txt'),'utf8').trim();
const actual=crypto.createHash('sha256').update(compressed).digest('hex');
if(actual!==expected) throw new Error(`Site bundle checksum mismatch: expected ${expected}, got ${actual}`);
const files=JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));
fs.rmSync(out,{recursive:true,force:true});
for(const [rel,content] of Object.entries(files)){
  if(rel.includes('..')||path.isAbsolute(rel)) throw new Error(`Unsafe output path: ${rel}`);
  const target=path.join(out,rel);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,content,'utf8');
}
console.log(`R&E V3 built ${Object.keys(files).length} files → ${out}`);
