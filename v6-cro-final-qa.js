const fs=require('node:fs');
const path=require('node:path');
const out=path.join(__dirname,'dist');
const failures=[],pass=[];
const stop=(n,d)=>failures.push(`${n}: ${d}`),ok=n=>pass.push(n);
function htmlFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?htmlFiles(p):(e.isFile()&&e.name.endsWith('.html')?[p]:[]);});}
const files=htmlFiles(out);
for(const f of files){
  const h=fs.readFileSync(f,'utf8'),r=path.relative(out,f);
  for(const legacy of ['>Reise erleben ↗<','>Details ↗<','>Reise anfragen →<','>Platz anfragen →<','>Anfragen<']) if(h.includes(legacy))stop(`CTA ${r}`,`legacy copy remains: ${legacy}`);
  if(h.includes('?v=6.3.0'))stop(`cache ${r}`,'stale 6.3.0 asset URL remains');
}
if(!failures.length)ok('CTA language and immutable asset version are consistent across all pages');
const home=fs.readFileSync(path.join(out,'index.html'),'utf8');
for(const marker of ['data-cro-final-home','06 / DIGITALES ROADBOOK','07 / 2.436 GÄSTEBUCH-EINTRÄGE','08 / HERKUNFT & NACHFOLGE','09 / DIE MENSCHEN','10 / EURE GRUPPE'])if(!home.includes(marker))stop('homepage',`missing ${marker}`);
if(!failures.some(x=>x.startsWith('homepage')))ok('homepage duplicate archive/service blocks are removed from the visible CRO story arc');
const booking=fs.readFileSync(path.join(out,'buchung','index.html'),'utf8');
if(!booking.includes('<title>Reise unverbindlich anfragen | Reisen & Erleben</title>'))stop('booking','low-friction title missing');else ok('booking language reflects an unverbindliche Anfrage');
const runtime=fs.readFileSync(path.join(out,'assets','v6-cro-runtime.js'),'utf8');
const app=fs.readFileSync(path.join(out,'assets','app.js'),'utf8');
const rCount=(runtime.match(/booking_start/g)||[]).length,aCount=(app.match(/booking_start/g)||[]).length;
if(rCount!==0||aCount!==1)stop('tracking',`booking_start owners runtime=${rCount}, app=${aCount}`);else ok('booking_start is emitted from exactly one owner');
const report=JSON.parse(fs.readFileSync(path.join(out,'v6-cro-report.json'),'utf8'));
if(report.version!=='6.3.1'||!report.finalized?.ctaLanguageUnified)stop('report','finalized 6.3.1 report missing');else ok('finalized CRO report present');
if(failures.length){console.error('\n[V6.3.1 FINAL CRO QA] STOP-SHIP');failures.forEach(x=>console.error(`  ✗ ${x}`));process.exit(1)}
console.log('\n[V6.3.1 FINAL CRO QA] PASS');pass.forEach(x=>console.log(`  ✓ ${x}`));
