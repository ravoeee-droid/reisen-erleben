const fs=require('node:fs');
const path=require('node:path');
const root=__dirname,out=path.join(root,'dist');
const failures=[],pass=[];
const stop=(n,d)=>failures.push(`${n}: ${d}`),ok=n=>pass.push(n);
function htmlFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?htmlFiles(p):(e.isFile()&&e.name.endsWith('.html')?[p]:[]);});}
function read(p){return fs.readFileSync(p,'utf8')}
const files=htmlFiles(out);
for(const file of files){const h=read(file),r=path.relative(out,file);if((h.match(/\/assets\/v6-cro\.css/g)||[]).length!==1)stop(`CRO CSS ${r}`,'expected exactly one include');if((h.match(/\/assets\/v6-cro-runtime\.js/g)||[]).length!==1)stop(`CRO JS ${r}`,'expected exactly one include');if(h.includes('>Jetzt buchen<'))stop(`CTA ${r}`,'legacy Jetzt buchen remains');}
if(!failures.length)ok('CRO assets and CTA language consistent across all pages');

const home=read(path.join(out,'index.html'));
for(const marker of ['cro-hero-actions','Passende Tour finden','4 Fragen · ca. 60 Sekunden']) if(!home.includes(marker))stop('homepage',`missing ${marker}`);
if(/<dialog class="finder"/i.test(home))stop('homepage','legacy duplicate finder dialog remains'); else ok('homepage has one finder path and direct hero conversion');

const reisen=read(path.join(out,'reisen','index.html'));
for(const marker of ['cro-tour-table','data-cro-filter="available"','data-cro-filter="short"','data-cro-filter="week"','data-cro-filter="long"','data-cro-filter="south"','data-cro-filter="alps"']) if(!reisen.includes(marker))stop('reisen',`missing ${marker}`);
const prices=(reisen.match(/class="cro-price"/g)||[]).length;
if(prices<10)stop('reisen',`only ${prices} sourced prices shown; expected >=10`); else ok(`${prices} tour prices sourced from generated detail pages`);

const booking=read(path.join(out,'buchung','index.html'));
for(const marker of ['data-booking-summary','Platz unverbindlich anfragen','E-Mail oder Telefon']) if(!booking.includes(marker))stop('booking',`missing ${marker}`);
if(/name="email"[^>]*required/i.test(booking))stop('booking','email still hard-required instead of email OR phone'); else ok('booking form reduced to one required contact channel');

let tourPages=0,tourEnhanced=0;
for(const file of files){const r=path.relative(out,file).replaceAll('\\','/');if(!r.startsWith('touren/')||!r.endsWith('/index.html'))continue;const h=read(file);if(!h.includes('class="tour-detail"'))continue;tourPages++;if(h.includes('cro-tour-proof')&&h.includes('cro-tour-fit')&&h.includes('cro-tour-faq'))tourEnhanced++;}
if(tourPages<10)stop('tour pages',`implausibly few detail pages (${tourPages})`);else if(tourEnhanced!==tourPages)stop('tour pages',`${tourEnhanced}/${tourPages} CRO-enhanced`);else ok(`all ${tourPages} tour detail pages carry proof, fit and FAQ layers`);

const v6=read(path.join(out,'assets','v6.js'));
if(v6.includes('tobi-v6-score'))stop('finder','fake percentage UI remains');else ok('finder uses recommendation language instead of fabricated percentage');
const report=JSON.parse(read(path.join(out,'v6-cro-report.json')));
if(report.finderCandidates<8)stop('finder',`only ${report.finderCandidates} candidates`);else ok(`finder uses ${report.finderCandidates} currently bookable tour candidates`);

const app=read(path.join(out,'assets','app.js'));
for(const marker of ['lead_success','lead_fail']) if(!app.includes(marker))stop('tracking',`app.js missing ${marker}`);
const runtime=read(path.join(out,'assets','v6-cro-runtime.js'));
for(const marker of ['tour_view','finder_open','finder_complete','travel_filter','tour_cta','booking_start','phone_click']) if(!runtime.includes(marker))stop('tracking',`runtime missing ${marker}`);
if(!failures.some(x=>x.startsWith('tracking')))ok('full discovery-to-lead CRO event instrumentation present');

const lead=read(path.join(root,'api','lead.js'));
for(const marker of ['LEAD_BACKUP_WEBHOOK_URL','lead_delivery_unconfigured','lead_delivery_failed','status(503)','status(502)']) if(!lead.includes(marker))stop('lead endpoint',`missing fail-closed marker ${marker}`);
if(!failures.some(x=>x.startsWith('lead endpoint')))ok('lead endpoint fails closed and supports a backup delivery webhook');
const event=read(path.join(root,'api','event.js'));
if(!event.includes("type:'cro_event'"))stop('event endpoint','cro event logging missing');else ok('privacy-safe CRO event endpoint present');

if(failures.length){console.error('\n[V6.3 CRO QA] STOP-SHIP');failures.forEach(x=>console.error(`  ✗ ${x}`));process.exit(1)}
console.log('\n[V6.3 CRO QA] PASS');pass.forEach(x=>console.log(`  ✓ ${x}`));
