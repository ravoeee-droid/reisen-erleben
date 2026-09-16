const fs=require('node:fs');
const path=require('node:path');
const out=path.join(__dirname,'dist');
const VERSION_FROM='6.3.0';
const VERSION_TO='6.3.1';
if(!fs.existsSync(out)) throw new Error('STOP-SHIP: dist missing before CRO finalizer');
function htmlFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?htmlFiles(p):(e.isFile()&&e.name.endsWith('.html')?[p]:[]);});}
function rel(file){return path.relative(out,file).replaceAll('\\','/');}
const files=htmlFiles(out);
for(const file of files){
  let h=fs.readFileSync(file,'utf8');
  // One language for the funnel: discover -> view tour -> ask for a place.
  h=h.replaceAll('>Reise erleben ↗<','>Tour ansehen ↗<');
  h=h.replaceAll('>Details ↗<','>Tour ansehen ↗<');
  h=h.replaceAll('>Reise anfragen →<','>Platz unverbindlich anfragen →<');
  h=h.replaceAll('>Platz anfragen →<','>Platz unverbindlich anfragen →<');
  h=h.replaceAll('>Anfragen<','>Platz anfragen<');

  if(rel(file)==='index.html'){
    // The full programme now has a dedicated conversion page; don't make the homepage repeat it.
    if(!h.includes('data-cro-final-home')) h=h.replace('</head>','<style data-cro-final-home>body[data-cro-page="home"] .archive,body[data-cro-page="home"] .service-grid{display:none!important}</style></head>');
    // Keep the visible story arc sequential after removing the duplicate archive/service blocks.
    const swaps=[
      ['07 / DIGITALES ROADBOOK','06 / DIGITALES ROADBOOK'],
      ['08 / 2.436 GÄSTEBUCH-EINTRÄGE','07 / 2.436 GÄSTEBUCH-EINTRÄGE'],
      ['09 / HERKUNFT & NACHFOLGE','08 / HERKUNFT & NACHFOLGE'],
      ['11 / DIE MENSCHEN','09 / DIE MENSCHEN'],
      ['12 / EURE GRUPPE','10 / EURE GRUPPE']
    ];
    for(const [from,to] of swaps)h=h.replace(from,to);
  }
  if(rel(file)==='buchung/index.html'){
    h=h.replace('<title>Reise anfragen & buchen | Reisen & Erleben</title>','<title>Reise unverbindlich anfragen | Reisen & Erleben</title>');
    h=h.replace('BUCHUNG / PERSÖNLICH','ANFRAGE / PERSÖNLICH');
  }
  // Immutable assets need a new URL whenever the runtime changes.
  h=h.replaceAll(`?v=${VERSION_FROM}`,`?v=${VERSION_TO}`);
  fs.writeFileSync(file,h,'utf8');
}

// booking_start is owned by app.js together with lead_success / lead_fail; remove duplicate capture event.
const runtimePath=path.join(out,'assets','v6-cro-runtime.js');
let runtime=fs.readFileSync(runtimePath,'utf8');
runtime=runtime.replace("\n      track('booking_start',{tour:select?.value||''});",'');
fs.writeFileSync(runtimePath,runtime,'utf8');

const reportPath=path.join(out,'v6-cro-report.json');
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
report.version=VERSION_TO;
report.finalized={singleBookingStartOwner:true,homepageArchiveRemoved:true,ctaLanguageUnified:true};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
console.log(`[V6.3.1 CRO] final consistency pass applied to ${files.length} pages`);
