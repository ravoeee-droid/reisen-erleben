const fs = require('node:fs');
const path = require('node:path');

const out = path.join(__dirname, 'dist');
const homePath = path.join(out, 'index.html');
const cssPath = path.join(out, 'assets', 'v6-content.css');
const ledgerPath = path.join(__dirname, 'FACTS-LEDGER.md');
const fail = [];
const pass = [];
const stop = (n,d) => fail.push(`${n}: ${d}`);
const ok = n => pass.push(n);

if (!fs.existsSync(homePath)) stop('homepage','missing');
if (!fs.existsSync(cssPath) || fs.statSync(cssPath).size < 5000) stop('content CSS','missing or implausibly small'); else ok('proof-led content CSS present');
if (!fs.existsSync(ledgerPath)) stop('facts ledger','missing'); else ok('facts ledger present');

if (fs.existsSync(homePath)) {
  const h = fs.readFileSync(homePath,'utf8');
  const markers = ['re-proof-rail','re-promise','re-returners','re-service-proof','re-heritage','re-club-cta'];
  for (const m of markers) h.includes(m) ? ok(`${m} present`) : stop('content architecture',`${m} missing`);
  if ((h.match(/\/assets\/v6-content\.css/g)||[]).length !== 1) stop('content stylesheet','expected exactly one include'); else ok('content stylesheet included once');
  if (!h.includes('2.436') || !h.includes('Stand 16.09.2026')) stop('guestbook proof','count must carry date/stand'); else ok('guestbook proof is date-scoped');
  if (!h.includes('≈ 8') || !h.includes('ca. 8 Motorräder')) stop('group proof','approximate group-size wording missing'); else ok('group-size proof stays approximate');
  if (!h.includes('bei vielen Reisen bis 15 kg p.P.') || !h.includes('Leistungsumfang und Gepäckservice unterscheiden sich je nach Tour')) stop('luggage guardrail','tour-dependent qualifier missing'); else ok('luggage claim is tour-qualified');
  if (!h.includes('unsere 13. Reise') || !h.includes('reisenunderleben.net/gaestebuch')) stop('returner proof','13th-trip evidence/link missing'); else ok('returner proof linked to guestbook');
  if (!h.includes('apps.apple.com/ch/app/reisen-erleben/id6749932588')) stop('app proof','official App Store link missing'); else ok('official app proof linked');
  if (!h.includes('mentor.ag/aktuelles/weiterlesen/nachfolge-erfolgreich-gestaltet')) stop('heritage proof','succession source link missing'); else ok('heritage proof linked');

  const order = ['class="hero"','re-proof-rail','re-promise','re-returners','class="journeys"','re-service-proof','class="concierge"','re-heritage','class="service-grid"','class="team"','re-club-cta'];
  let last = -1;
  for (const token of order) {
    const idx = h.indexOf(token);
    if (idx < 0) { stop('section order',`${token} missing`); break; }
    if (idx <= last) { stop('section order',`${token} appears out of order`); break; }
    last = idx;
  }
  if (!fail.some(x=>x.startsWith('section order'))) ok('proof-led story arc order is stable');
}

if (fail.length) {
  console.error('\n[V6.2 CONTENT QA] STOP-SHIP');
  fail.forEach(x=>console.error(`  ✗ ${x}`));
  process.exit(1);
}
console.log('\n[V6.2 CONTENT QA] PASS');
pass.forEach(x=>console.log(`  ✓ ${x}`));
