const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const out = path.join(root, 'dist');
const homePath = path.join(out, 'index.html');
const cssSrc = path.join(root, 'v6-content.css');
const cssOut = path.join(out, 'assets', 'v6-content.css');
const VERSION = '6.2.0';

if (!fs.existsSync(homePath)) throw new Error('STOP-SHIP: homepage missing before V6.2 content upgrade');
if (!fs.existsSync(cssSrc)) throw new Error('STOP-SHIP: v6-content.css missing');
fs.copyFileSync(cssSrc, cssOut);

let html = fs.readFileSync(homePath, 'utf8');
function replaceOnce(pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`STOP-SHIP: V6.2 could not find ${label}`);
  html = html.replace(pattern, replacement);
}

// Keep metadata factual and specific.
html = html.replace(/<meta name="description" content="[^"]*">/i,
  '<meta name="description" content="Geführte Motorradreisen seit 2002: kleine Fahrgruppen, drei Fahrstile, persönliche Tourguides, Gepäckservice und 2.436 Gästebuch-Einträge.">');
html = html.replace(/<meta property="og:description" content="[^"]*">/i,
  '<meta property="og:description" content="Seit 2002 geführte Motorradreisen mit kleinen Gruppen, persönlicher Organisation und einer Community, die immer wieder zurückkommt.">');

// Add the content layer after the existing cache-busted V6 stylesheet.
if (!html.includes('/assets/v6-content.css')) {
  html = html.replace('</head>', `<link rel="stylesheet" href="/assets/v6-content.css?v=${VERSION}"></head>`);
}

const proofRail = `
<section class="re-proof-rail" aria-label="Reisen und Erleben auf einen Blick">
  <div class="re-proof-rail-inner">
    <article class="re-proof-item"><strong>2002</strong><span>als Familienunternehmen <em>gegründet</em></span></article>
    <article class="re-proof-item"><strong>2.436</strong><span>Gästebuch-Einträge <em>Stand 16.09.2026</em></span></article>
    <article class="re-proof-item"><strong>≈ 8</strong><span>Motorräder <em>pro Tourguide</em></span></article>
    <article class="re-proof-item"><strong>3</strong><span>Fahrstile: <em>zügig · mix · gemütlich</em></span></article>
  </div>
</section>`;
replaceOnce(/(<section class="hero">[\s\S]*?<\/section>)/i, `$1${proofRail}`, 'hero section');

const promise = `
<section class="re-promise" aria-labelledby="re-promise-title">
  <div class="re-promise-inner">
    <div class="re-promise-copy">
      <div class="re-v6-kicker">01 / DAS EIGENTLICHE PRODUKT</div>
      <h2 class="re-v6-title" id="re-promise-title">Du fährst.<br><i>Wir tragen den Rest.</i></h2>
      <p>Eine gute Motorradreise beginnt nicht bei der Route. Sie beginnt damit, dass du dich um möglichst wenig kümmern musst. <strong>R&E plant Strecke, Hotels, Gruppe und Organisation so, dass auf dem Motorrad nur noch eine Frage übrig bleibt: Wo ist die nächste Kurve?</strong></p>
    </div>
    <div>
      <div class="re-promise-ledger" aria-label="Was Reisen und Erleben organisiert">
        <div class="re-promise-line"><span>01</span><strong>Fahrgruppe, die zu dir passt</strong><small>ca. 8 Motorräder / Guide</small></div>
        <div class="re-promise-line"><span>02</span><strong>Sorgfältig ausgewählte Hotels</strong><small>meist gehobene 3–4 Sterne</small></div>
        <div class="re-promise-line"><span>03</span><strong>Gepäck fährt separat</strong><small>bei vielen Reisen bis 15 kg p.P.</small></div>
        <div class="re-promise-line"><span>04</span><strong>Tagestouren & Reiseunterlagen</strong><small>vorbereitet statt improvisiert</small></div>
        <div class="re-promise-line"><span>05</span><strong>Absicherung der Reiseleistung</strong><small>inkl. Reisesicherungsschein</small></div>
      </div>
      <p class="re-promise-note">Leistungsumfang und Gepäckservice unterscheiden sich je nach Tour. Entscheidend ist der jeweilige Leistungsblock der Reise.</p>
    </div>
  </div>
</section>`;
replaceOnce(/<section class="manifesto">[\s\S]*?<\/section>/i, promise, 'manifesto section');

const returners = `
<section class="re-returners" aria-labelledby="re-returners-title">
  <div class="re-returners-inner">
    <header class="re-returners-head">
      <div class="re-v6-kicker">02 / DER STÄRKSTE BEWEIS</div>
      <h2 class="re-v6-title" id="re-returners-title">Nicht eine Bewertung.<br><i>Die nächste Buchung.</i></h2>
      <p>Ein Gästebuch mit tausenden Einträgen ist stark. Noch stärker ist, wenn Menschen nach Jahren wiederkommen — und irgendwann nicht mehr ihre erste, sondern ihre fünfte oder dreizehnte R&E-Reise zählen.</p>
    </header>
    <div class="re-returners-hero">
      <div class="re-returners-photo"><img src="/assets/media/re-e2364eb5413c89.webp" alt="R&E Motorradgruppe gemeinsam auf Tour" loading="lazy" decoding="async"></div>
      <div class="re-returners-story">
        <div>
          <small>GÄSTEBUCH · 02.09.2026 · TOUR TIROL</small>
          <blockquote>Sie kamen wieder. Zur gleichen Tour. Und schrieben danach nur vier Worte, die mehr sagen als jedes Werbeversprechen: <strong>„unsere 13. Reise“.</strong></blockquote>
        </div>
        <div class="re-returners-meta"><span>Karl-Frieder & Christine · Freiburg<br>Organisation, Tourenwahl und Gruppengefühl erneut positiv hervorgehoben.</span><a href="https://www.reisenunderleben.net/gaestebuch" target="_blank" rel="noopener">Gästebuch öffnen ↗</a></div>
      </div>
    </div>
    <div class="re-returners-grid">
      <article class="re-return-card"><span>5. TOUR · AUGUST 2026</span><p>Ein Teilnehmer berichtet von seiner fünften R&E-Tour — und davon, wie Guides bei einer Motorradpanne bis spät am Abend nach einer Lösung gesucht haben.</p><small>P. Drews · Tirol 2026</small></article>
      <article class="re-return-card"><span>WIEDERKOMMER</span><p>Ein Gast aus Oldenburg schreibt, er habe aufgehört mitzuzählen. Entscheidend für ihn: Organisation, Durchführung und die Menschen in seiner Gruppe.</p><small>Johannes · Riesengebirge 2026</small></article>
      <article class="re-return-card"><span>ERSTFAHRER</span><p>Auch das Gegenteil zählt: Nach seiner ersten R&E-Reise durch Rumänien schrieb ein Gast, dass es bestimmt nicht die letzte gewesen sei.</p><small>Diethelm · Donaudelta / Rumänien 2026</small></article>
    </div>
  </div>
</section>`;
replaceOnce(/(<section class="journeys"\b)/i, `${returners}\n$1`, 'journeys insertion point');

const serviceProof = `
<section class="re-service-proof" aria-labelledby="re-service-title">
  <div class="re-service-proof-inner">
    <header class="re-service-proof-head">
      <div><div class="re-v6-kicker">04 / WAS „ORGANISIERT“ WIRKLICH HEISST</div><h2 class="re-v6-title" id="re-service-title">Vier Dinge, die du<br><i>unterwegs spürst.</i></h2></div>
      <p>Keine abstrakten Benefits. Das sind konkrete Details aus dem heutigen R&E-Service — genau die Dinge, die darüber entscheiden, ob eine Gruppenreise entspannt oder anstrengend wird.</p>
    </header>
    <div class="re-service-grid">
      <article class="re-service-card"><span class="num">01 / GRUPPE</span><strong>Du musst niemandem hinterherfahren.</strong><p>Jeder Tourguide führt ungefähr acht Motorräder. Eingeteilt wird nach Fahrstil und Fahrkönnen in zügig, zügig/gemütlich und gemütlich. Passt es doch nicht, kann nach Rücksprache die Gruppe gewechselt werden.</p><b>Wohlfühlen statt falscher Stolz</b></article>
      <article class="re-service-card"><span class="num">02 / GEPÄCK</span><strong>Das Motorrad bleibt Motorrad.</strong><p>Bei vielen Reisen fährt ein Begleitfahrzeug oder Gepäckanhänger mit. Bis zu 15 kg Reisegepäck pro Person können dann separat transportiert werden — damit die Maschine nicht zum Lastesel wird.</p><b>Tourabhängig · Leistungsblock beachten</b></article>
      <article class="re-service-card"><span class="num">03 / HOTEL</span><strong>Ankommen, Maschine abstellen, Abend genießen.</strong><p>R&E wählt Hotels nach Atmosphäre, sauberer Unterkunft, gutem Essen und sicheren Abstellmöglichkeiten oder Garagen aus. In der Regel sind es gehobene 3- oder 4-Sterne-Häuser.</p><b>Mehr Reisegefühl, weniger Logistik</b></article>
      <article class="re-service-card"><span class="num">04 / APP</span><strong>Deine Reisemappe funktioniert auch ohne Netz.</strong><p>Die offizielle R&E-App speichert Reiseprogramm, wichtige Kontakte und Reiseführer auf dem Smartphone. Nach dem Download vor der Abreise stehen die Inhalte auch offline zur Verfügung.</p><b><a href="https://apps.apple.com/ch/app/reisen-erleben/id6749932588" target="_blank" rel="noopener">R&E App ansehen ↗</a></b></article>
    </div>
    <div class="re-service-proof-foot"><p>Alle Angaben sind aus dem aktuellen R&E-Service, den FAQ und der offiziellen Reise-App abgeleitet. Einzelne Leistungen unterscheiden sich je nach Reise.</p><a class="dark-btn" href="/service/">Service im Detail ↗</a></div>
  </div>
</section>`;
replaceOnce(/(<section class="concierge">)/i, `${serviceProof}\n$1`, 'concierge insertion point');

const heritage = `
<section class="re-heritage" aria-labelledby="re-heritage-title">
  <div class="re-heritage-inner">
    <div class="re-heritage-copy">
      <div class="re-v6-kicker">08 / HERKUNFT & NACHFOLGE</div>
      <h2 class="re-v6-title" id="re-heritage-title">Eine Marke mit<br><i>echter Strecke.</i></h2>
      <p>R&E ist kein neu erfundenes Reise-Label. Hinter der heutigen Marke steht eine nachvollziehbare Unternehmensgeschichte — vom Familienunternehmen bis zur geregelten Nachfolge in die nächste Unternehmergeneration.</p>
    </div>
    <div class="re-timeline">
      <article><time>2002</time><div><h3>Vater und Tochter starten R&E.</h3><p>Der erfahrene Busreise-Unternehmer Jürgen Werner gründet Reisen & Erleben gemeinsam mit seiner Tochter Nadja Vollmar-Werner.</p></div></article>
      <article><time>2023</time><div><h3>Die Nachfolge wird bewusst geregelt.</h3><p>Nicebike übernimmt R&E zum 01.01.2023. Standort St. Wendel und Arbeitsplätze bleiben erhalten; Ralf Nolte übernimmt als Geschäftsführer.</p></div></article>
      <article><time>Heute</time><div><h3>Die Geschichte fährt weiter.</h3><p>2.436 Gästebuch-Einträge, langjährige Wiederkommer, aktuelle Reisen 2026/2027 und eine eigene digitale Reise-App verbinden gewachsene Community mit moderner Reiseorganisation. <a href="https://www.mentor.ag/aktuelles/weiterlesen/nachfolge-erfolgreich-gestaltet-nicebike-fuehrt-reisen-erleben-in-st-wendel-fort" target="_blank" rel="noopener">Zur dokumentierten Nachfolge ↗</a></p></div></article>
    </div>
  </div>
</section>`;
replaceOnce(/(<section class="service-grid">)/i, `${heritage}\n$1`, 'service-grid insertion point');

const clubCta = `
<section class="re-club-cta" aria-labelledby="re-club-title">
  <div class="re-club-cta-inner">
    <small>11 / EURE GRUPPE<br>EURE REISE</small>
    <h2 id="re-club-title">Ihr seid schon eine Gruppe?<br>Dann baut R&E <em>eure Tour.</em></h2>
    <div><p>Für Clubs, Vereine, Cliquen, Firmen und Stammtischbiker erstellt R&E ab 15 Teilnehmern individuelle Reiseangebote. Geschlossene Gruppen können außerdem ausgewählte Programmtouren gemeinsam buchen.</p><a class="light-btn" href="/club-touren/">Club- & Gruppenreisen ↗</a></div>
  </div>
</section>`;
replaceOnce(/(<\/main>)/i, `${clubCta}\n$1`, 'main closing tag');

// Guard against accidental duplicate injection or missing evidence architecture.
for (const marker of ['re-proof-rail','re-returners','re-service-proof','re-heritage','re-club-cta','2.436','unsere 13. Reise']) {
  if (!html.includes(marker)) throw new Error(`STOP-SHIP: V6.2 marker missing: ${marker}`);
}
if ((html.match(/v6-content\.css/g) || []).length !== 1) throw new Error('STOP-SHIP: V6.2 stylesheet must appear exactly once');

fs.writeFileSync(homePath, html);
console.log('[V6.2] homepage rebuilt around proof, repeat customers, service evidence, heritage and group conversion');
