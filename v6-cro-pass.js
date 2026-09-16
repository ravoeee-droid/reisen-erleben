const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const out=path.join(root,'dist');
const assets=path.join(out,'assets');
const VERSION='6.3.0';
if(!fs.existsSync(out)) throw new Error('STOP-SHIP: dist missing before CRO pass');

function htmlFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?htmlFiles(p):(e.isFile()&&e.name.endsWith('.html')?[p]:[]);});}
function rel(file){return path.relative(out,file).replaceAll('\\','/');}
function plain(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
function pageHref(file){const r=rel(file);return '/'+r.replace(/index\.html$/,'').replace(/\.html$/,'');}
function markBody(html,page){return html.replace(/<body(?![^>]*data-cro-page)([^>]*)>/i,`<body data-cro-page="${page}"$1>`);}
function addAssets(html){
  if(!html.includes('/assets/v6-cro.css')) html=html.replace('</head>',`<link rel="stylesheet" href="/assets/v6-cro.css?v=${VERSION}"></head>`);
  if(!html.includes('/assets/v6-cro-runtime.js')) html=html.replace('</body>',`<script defer src="/assets/v6-cro-runtime.js?v=${VERSION}"></script></body>`);
  html=html.replace(/\/assets\/app\.js(?:\?v=[^"']*)?/g,`/assets/app.js?v=${VERSION}`);
  html=html.replace(/\/assets\/v6\.js(?:\?v=[^"']*)?/g,`/assets/v6.js?v=${VERSION}`);
  return html;
}
function globalCopy(html){
  html=html.replace(/>Jetzt buchen</g,'>Reise anfragen<');
  html=html.replaceAll('Fünf Fragen statt Filterwand','Vier Fragen statt Filterwand');
  return html;
}

fs.copyFileSync(path.join(root,'v6-cro.css'),path.join(assets,'v6-cro.css'));
fs.copyFileSync(path.join(root,'v6-cro-runtime.js'),path.join(assets,'v6-cro-runtime.js'));
const files=htmlFiles(out);

// Build a price ledger from the actual generated tour pages — never invent prices.
const priceByHref=new Map();
for(const file of files){
  const r=rel(file); if(!r.startsWith('touren/')||!r.endsWith('/index.html')) continue;
  const h=fs.readFileSync(file,'utf8');
  const m=h.match(/<small>FAHRER IM DZ<\/small>\s*<strong>([^<]+)<\/strong>/i)||h.match(/<div class="booking-price">[\s\S]*?<strong>([^<]+)<\/strong>/i);
  if(m) priceByHref.set(pageHref(file),plain(m[1]));
}

let finderCandidates=[];
for(const file of files){
  let html=fs.readFileSync(file,'utf8');
  const r=rel(file);
  html=globalCopy(html);

  if(r==='index.html'){
    html=markBody(html,'home');
    html=html.replace(/\s*<dialog class="finder"[\s\S]*?<\/dialog>/i,'');
    if(!html.includes('cro-hero-actions')){
      html=html.replace(/(<div class="hero-bottom"><p>[\s\S]*?<\/p>)/i,`$1<div class="cro-hero-actions"><button class="cro-primary" type="button" data-open-finder>Passende Tour finden →</button><a class="cro-secondary" href="/reisen/">Reisen ansehen</a><span class="cro-hero-note">4 Fragen · ca. 60 Sekunden · unverbindlich · 2.436 Gästebuch-Einträge</span></div>`);
    }
  } else if(r==='reisen/index.html'){
    html=markBody(html,'reisen');
    // Replace the old status-only filter bar with decision-oriented discovery controls.
    html=html.replace(/<div class="archive-tools">[\s\S]*?<\/div>/i,'');
    const controls=`<div class="cro-filter-shell"><div style="display:flex;align-items:center;gap:16px"><span class="cro-filter-label">Welche Reise passt gerade?</span><span class="cro-tour-count" data-cro-count></span></div><div class="cro-filter-bar"><button class="cro-filter-btn active" type="button" data-cro-filter="available">Nächste freie</button><button class="cro-filter-btn" type="button" data-cro-filter="short">3–5 Tage</button><button class="cro-filter-btn" type="button" data-cro-filter="week">6–9 Tage</button><button class="cro-filter-btn" type="button" data-cro-filter="long">10+ Tage</button><button class="cro-filter-btn" type="button" data-cro-filter="south">Sonne & Süden</button><button class="cro-filter-btn" type="button" data-cro-filter="alps">Alpen & Pässe</button><button class="cro-filter-btn" type="button" data-cro-filter="all">Archiv / alle</button></div><p class="cro-filter-help">Standardmäßig siehst du nur Reisen mit freien oder wenigen Plätzen. Ausgebuchte und vergangene Touren bleiben im Archiv erreichbar.</p></div>`;
    html=html.replace('<div class="tour-table">',`${controls}<div class="tour-table cro-tour-table">`);
    html=html.replace(/<a class="tour-row"[\s\S]*?<\/a>/g,row=>{
      const status=row.match(/data-status="([^"]+)"/i)?.[1]||'';
      const href=row.match(/href="([^"]+)"/i)?.[1]||'';
      const title=plain(row.match(/<strong>([\s\S]*?)<\/strong>/i)?.[1]||'');
      const days=Number(row.match(/<span>(\d+) Tage<\/span>/i)?.[1]||0);
      const date=plain(row.match(/<span>(\d{2}\.\d{2}[–-][^<]+)<\/span>/i)?.[1]||'');
      const low=title.toLowerCase();
      let theme='other';
      if(/andalus|spanien|portugal|istrien|kroat|teneriff|sardin|toskana|korsika|adria/.test(low)) theme='south';
      else if(/trentino|gardasee|salzkammergut|slowen|allgäu|allgaeu|tirol|schweiz|alpen|dolomit|großglockner|grossglockner/.test(low)) theme='alps';
      row=row.replace(/<a class="tour-row"/i,`<a class="tour-row" data-cro-duration="${days}" data-cro-theme="${theme}"`);
      const price=priceByHref.get(href);
      if(price && !row.includes('cro-price-status')) row=row.replace(/(<span class="status [^"]+">[\s\S]*?<\/span>)/i,`<span class="cro-price-status"><b class="cro-price">ab ${price}</b>$1</span>`);
      if((status==='free'||status==='few')&&href.startsWith('/touren/')){
        const month=Number(date.match(/\.([0-9]{2})[–-]/)?.[1]||date.match(/\.([0-9]{2})\./)?.[1]||0);
        const season=month>=3&&month<=5?'fruehjahr':month>=6&&month<=8?'sommer':month>=9&&month<=11?'herbst':'offen';
        const feeling=theme==='south'?'sonne':theme==='alps'?'paesse':(/vogesen|harz|kurven|ardennen|hunsrück|hunsrueck|odenwald|spessart/.test(low)?'kurven':'genuss');
        const duration=days<=5?'kurz':days<=9?'woche':'lang';
        finderCandidates.push({name:title,href,meta:`${days} Tage${date?` · ${date}`:''}`,tags:[season,feeling,duration]});
      }
      return row;
    });
  } else if(r==='buchung/index.html'){
    html=markBody(html,'booking');
    html=html.replace(/(<input\b[^>]*name="(?:lastName|email)"[^>]*?)\srequired=""/gi,'$1');
    html=html.replace('<label>Nachname</label>','<label>Nachname <small>optional</small></label>');
    html=html.replace('<label>E-Mail</label>','<label>E-Mail <small>E-Mail oder Telefon</small></label>');
    html=html.replace('<label>Telefon</label>','<label>Telefon <small>E-Mail oder Telefon</small></label>');
    html=html.replace('Unverbindlich anfragen →','Platz unverbindlich anfragen →');
    if(!html.includes('data-booking-summary')) html=html.replace('<form class="form-panel"',`<div class="cro-booking-summary" data-booking-summary><small>DEINE AUSGEWÄHLTE REISE</small><strong data-booking-title>Persönliche Beratung</strong><span data-booking-copy>Deine Anfrage ist unverbindlich. R&E meldet sich persönlich bei dir.</span></div><form class="form-panel"`);
    html=html.replace('</form>','<p class="cro-booking-page-note">Für die erste Anfrage reichen Vorname und mindestens ein Kontaktweg. Zimmer, Sozius/Sozia und weitere Details können später geklärt werden.</p></form>');
  } else if(r.startsWith('touren/')&&r.endsWith('/index.html')){
    html=markBody(html,'tour');
    html=html.replace(/(<section class="tour-visual">[\s\S]*?<img\b[^>]*?)loading="lazy"/i,'$1loading="eager"');
    const days=Number(html.match(/REISE[^<]*\/\s*(\d+) TAGE/i)?.[1]||html.match(/<span>(\d+) Tage<\/span>/i)?.[1]||0);
    const fit=days<=5?'Du willst kompakt raus, ohne dass aus einem langen Wochenende eine halbe Weltreise wird.':days<=9?'Du willst eine volle Motorradwoche mit genug Zeit für Strecke, Gruppe und gute Abende.':'Du willst wirklich weg, mehrere Regionen erleben und hast Lust auf eine längere gemeinsame Reise.';
    if(!html.includes('cro-tour-proof')){
      const proof=`<section class="cro-tour-proof"><div class="cro-tour-proof-inner"><article><strong>Seit 2002</strong><span>geführte Motorradreisen</span></article><article><strong>2.436</strong><span><a href="/gaestebuch/">Gästebuch-Einträge ↗</a></span></article><article><strong>≈ 8</strong><span>Motorräder je Tourguide</span></article><article><strong>3</strong><span>Fahrstile für die Gruppe</span></article></div></section>`;
      html=html.replace(/(<section class="tour-facts">[\s\S]*?<\/section>)/i,`$1${proof}`);
    }
    if(!html.includes('cro-tour-fit')){
      const fitSection=`<section class="cro-tour-fit"><div class="cro-tour-fit-inner"><header class="cro-tour-fit-head"><div><div class="eyebrow">PASST DIESE REISE ZU DIR?</div><h2>Die Tour soll nicht nur gut aussehen.<br><i>Sie soll zu dir passen.</i></h2></div><p>${fit} Wenn du bei Fahrstil, Anreise oder Ablauf unsicher bist, klärt R&E das lieber vor der Anfrage persönlich als hinterher.</p></header><div class="cro-fit-grid"><article class="cro-fit-card"><span>01 / DAUER</span><strong>${days||'Mehrere'} Tage, die wirklich nach Reise aussehen.</strong><p>Termin und Dauer stehen oben transparent. So kannst du zuerst prüfen, ob die Tour überhaupt in dein Zeitfenster passt.</p></article><article class="cro-fit-card"><span>02 / GRUPPE</span><strong>Kleine Fahrgruppen statt Motorrad-Konvoi.</strong><p>Pro Tourguide fahren ungefähr acht Motorräder. Die Einteilung erfolgt in drei Fahrstilen, damit niemand permanent hinterherjagen oder warten muss.</p></article><article class="cro-fit-card"><span>03 / BERATUNG</span><strong>Unsicher? Frag, bevor du anfragst.</strong><p>R&E ist telefonisch erreichbar und kann Fahrprofil, Leistungen, Anreise und offene Punkte direkt mit dir klären.</p></article></div><div class="cro-tour-faq"><details><summary>Wie groß ist meine Fahrgruppe?</summary><p>R&E plant ungefähr acht Motorräder pro Tourguide. Die tatsächliche Einteilung richtet sich nach Reise und Teilnehmerfeld.</p></details><details><summary>Was, wenn mein Fahrstil nicht zur Gruppe passt?</summary><p>Es gibt die Fahrstile zügig, zügig/gemütlich und gemütlich. Wenn eine andere Gruppe besser passt, kann nach Rücksprache gewechselt werden.</p></details><details><summary>Was ist im Reisepreis enthalten?</summary><p>Entscheidend ist immer der Leistungsblock genau dieser Reise. Dort stehen Unterkunft, Verpflegung, Transporte und weitere enthaltene Leistungen transparent aufgelistet.</p></details><details><summary>Kann ich die Reise erst unverbindlich anfragen?</summary><p>Ja. Die Website führt bewusst zunächst zu einer unverbindlichen Anfrage. R&E kann Verfügbarkeit und offene Details anschließend persönlich klären.</p></details></div><div class="cro-tour-help"><p>Noch nicht sicher, ob genau diese Reise passt?</p><button class="outline-btn" type="button" data-open-finder>In 4 Fragen Tour finden →</button></div></div></section>`;
      html=html.replace(/(<section class="tour-cta">)/i,`${fitSection}$1`);
    }
  } else {
    html=markBody(html,'content');
  }

  html=addAssets(html);
  fs.writeFileSync(file,html,'utf8');
}

// Expand the single Tobi finder to the actual bookable programme and remove fake match percentages.
const v6Path=path.join(assets,'v6.js');
let v6=fs.readFileSync(v6Path,'utf8');
if(finderCandidates.length<8) throw new Error(`STOP-SHIP: CRO finder candidate set too small (${finderCandidates.length})`);
v6=v6.replace(/const candidates = \[[\s\S]*?\];\n    const questions =/,`const candidates = ${JSON.stringify(finderCandidates)};\n    const questions =`);
v6=v6.replace("const pct = Math.min(98, 78 + best.score*5);","const pct = null;");
v6=v6.replace('<div class="tobi-v6-message result"><span>DEIN TOUR-MATCH</span><p><strong>${best.name}</strong> passt gerade am besten zu dir.</p></div>','<div class="tobi-v6-message result"><span>UNSERE EMPFEHLUNG</span><p><strong>${best.name}</strong> passt zu deinen Angaben.</p></div>');
v6=v6.replace('<article class="tobi-v6-match"><div><span class="tobi-v6-score">${pct}%</span><small>Match</small></div><div><strong>${best.name}</strong><span>${best.meta}</span></div></article>','<article class="tobi-v6-match"><div class="tobi-v6-recommendation"><strong>EMPFEHLUNG</strong><small>aus deinen 4 Antworten</small></div><div><strong>${best.name}</strong><span>${best.meta}</span><small>Passend zu Zeitraum, Reisegefühl und gewünschter Dauer. Den Fahrstil ordnet R&E innerhalb der Reisegruppe passend zu.</small></div></article>');
fs.writeFileSync(v6Path,v6,'utf8');

// Add funnel success/failure events to the existing lead form handler.
const appPath=path.join(assets,'app.js');
let app=fs.readFileSync(appPath,'utf8');
app=app.replace("if(btn){btn.disabled=true;btn.textContent='Wird vorbereitet …';}","if(btn){btn.disabled=true;btn.textContent='Wird vorbereitet …';} window.reTrack?.('booking_start',{tour:form.querySelector('[name=\"tour\"]')?.value||'',source:location.pathname});");
app=app.replace("if(!res.ok) throw new Error('api');\n      form.innerHTML=", "if(!res.ok) throw new Error('api');\n      window.reTrack?.('lead_success',{tour:payload.tour||'',source:location.pathname});\n      form.innerHTML=");
app=app.replace("}catch{\n      form.innerHTML=", "}catch{\n      window.reTrack?.('lead_fail',{tour:payload.tour||'',source:location.pathname});\n      form.innerHTML=");
fs.writeFileSync(appPath,app,'utf8');

fs.writeFileSync(path.join(out,'v6-cro-report.json'),JSON.stringify({version:VERSION,htmlFiles:files.length,priceCoverage:priceByHref.size,finderCandidates:finderCandidates.length,leadFlow:'fail-closed-required'},null,2));
console.log(`[V6.3 CRO] ${files.length} pages patched; ${priceByHref.size} tour prices sourced; ${finderCandidates.length} live finder candidates`);
