const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname,'dist');
const cssPath = path.join(dist,'assets','v6.css');
const fixPath = path.join(__dirname,'v6-layout-fix.css');
const version = '6.1.1';

if (!fs.existsSync(cssPath)) throw new Error('STOP-SHIP: v6.css missing before layout guard');
if (!fs.existsSync(fixPath)) throw new Error('STOP-SHIP: v6-layout-fix.css missing');

fs.appendFileSync(cssPath, '\n\n' + fs.readFileSync(fixPath,'utf8') + '\n');

function htmlFiles(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const p=path.join(dir,entry.name);
    return entry.isDirectory()?htmlFiles(p):(entry.isFile()&&entry.name.endsWith('.html')?[p]:[]);
  });
}

let patched = 0;
for (const file of htmlFiles(dist)) {
  let html = fs.readFileSync(file,'utf8');
  const next = html
    .replace(/href=["']\/assets\/v6\.css(?:\?[^"']*)?["']/g, `href="/assets/v6.css?v=${version}"`)
    .replace(/src=["']\/assets\/v6\.js(?:\?[^"']*)?["']/g, `src="/assets/v6.js?v=${version}"`);
  if (next !== html) {
    fs.writeFileSync(file,next,'utf8');
    patched++;
  }
}

console.log(`[V6.1] layout guard appended; cache-busted ${patched} HTML files with v=${version}`);
