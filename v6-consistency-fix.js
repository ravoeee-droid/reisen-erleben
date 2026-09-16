const fs = require('node:fs');
const path = require('node:path');
const homePath = path.join(__dirname,'dist','index.html');
if (!fs.existsSync(homePath)) throw new Error('STOP-SHIP: homepage missing before consistency pass');
let h = fs.readFileSync(homePath,'utf8');

// One source of truth for the current dated guestbook count.
h = h.replaceAll('2.434 Einträge','2.436 Einträge');
h = h.replaceAll('2.434 GÄSTEBUCH-EINTRÄGE','2.436 GÄSTEBUCH-EINTRÄGE');

// Make the opening claim precise rather than vague.
h = h.replace('Seit Jahrzehnten planen wir geführte Motorradreisen für Menschen, die nicht nur Kilometer sammeln wollen — sondern Erinnerungen, Kurven und gute Abende mit der Gruppe.',
  'Seit 2002 plant R&E geführte Motorradreisen für Menschen, die nicht nur Kilometer sammeln wollen — sondern Erinnerungen, Kurven und gute Abende mit der Gruppe.');

// Story-arc numbering after the V6.2 sections were inserted.
const swaps = [
  ['02 / REISEN 2027','03 / REISEN 2027'],
  ['03 / TOUR CONCIERGE','05 / TOUR CONCIERGE'],
  ['04 / TOUR ARCHIV','06 / TOUR ARCHIV'],
  ['05 / DIGITALES ROADBOOK','07 / DIGITALES ROADBOOK'],
  ['06 / 2.436 GÄSTEBUCH-EINTRÄGE','08 / 2.436 GÄSTEBUCH-EINTRÄGE'],
  ['08 / HERKUNFT & NACHFOLGE','09 / HERKUNFT & NACHFOLGE'],
  ['07 / ALLES FÜR DEINE REISE','10 / ALLES FÜR DEINE REISE'],
  ['08 / DIE MENSCHEN','11 / DIE MENSCHEN'],
  ['11 / EURE GRUPPE','12 / EURE GRUPPE']
];
for (const [from,to] of swaps) h = h.replace(from,to);

if (h.includes('2.434')) throw new Error('STOP-SHIP: stale guestbook count remains');
for (const token of ['03 / REISEN 2027','05 / TOUR CONCIERGE','06 / TOUR ARCHIV','07 / DIGITALES ROADBOOK','08 / 2.436 GÄSTEBUCH-EINTRÄGE','09 / HERKUNFT & NACHFOLGE','10 / ALLES FÜR DEINE REISE','11 / DIE MENSCHEN','12 / EURE GRUPPE']) {
  if (!h.includes(token)) throw new Error(`STOP-SHIP: numbering marker missing: ${token}`);
}
fs.writeFileSync(homePath,h);
console.log('[V6.2.1] proof counts, hero claim and story numbering normalised');
