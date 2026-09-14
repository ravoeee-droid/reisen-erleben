const fs = require('node:fs');
const path = require('node:path');

const out = path.join(__dirname, 'dist');
const failures = [];
const pass = [];

function stop(name, detail) { failures.push(`${name}: ${detail}`); }
function ok(name) { pass.push(name); }
function htmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(p) : (entry.isFile() && entry.name.endsWith('.html') ? [p] : []);
  });
}
function count(haystack, needle) { return haystack.split(needle).length - 1; }

if (!fs.existsSync(out)) stop('dist', 'missing');
const files = htmlFiles(out);
if (!files.length) stop('html', 'no HTML files emitted');
else ok(`${files.length} HTML files emitted`);

const v6js = path.join(out, 'assets', 'v6.js');
const v6css = path.join(out, 'assets', 'v6.css');
if (!fs.existsSync(v6js) || fs.statSync(v6js).size < 1000) stop('v6.js', 'missing or implausibly small'); else ok('v6.js present');
if (!fs.existsSync(v6css) || fs.statSync(v6css).size < 1000) stop('v6.css', 'missing or implausibly small'); else ok('v6.css present');

let home = '';
const homePath = path.join(out, 'index.html');
if (!fs.existsSync(homePath)) stop('homepage', 'dist/index.html missing');
else {
  home = fs.readFileSync(homePath, 'utf8');
  const heroSection = home.match(/<section\b[^>]*class=["'][^"']*\bhero\b[^"']*["'][\s\S]*?<\/section>/i)?.[0] || '';
  const heroImg = heroSection.match(/<img\b[^>]*>/i)?.[0] || '';
  const heroSrc = heroImg.match(/\bsrc=["']([^"']+)["']/i)?.[1] || '';
  if (!heroImg) stop('hero', 'hero image missing');
  else if (!heroSrc) stop('hero', 'hero src missing');
  else if (/logo/i.test(heroSrc)) stop('hero', `logo used as hero (${heroSrc})`);
  else {
    ok('hero uses a real scene image');
    if (!/fetchpriority=["']high["']/i.test(heroImg)) stop('hero priority', 'fetchpriority=high missing'); else ok('hero priority high');
    if (!/loading=["']eager["']/i.test(heroImg)) stop('hero loading', 'loading=eager missing'); else ok('hero eager');
    if (!home.includes(`rel="preload" as="image" href="${heroSrc}"`) && !home.includes(`rel='preload' as='image' href='${heroSrc}'`)) stop('hero preload', 'preload missing'); else ok('hero preload present');
  }
}

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(out, file);
  if (count(html, '/assets/v6.css') !== 1) stop(`V6 CSS ${rel}`, `expected 1 include, got ${count(html, '/assets/v6.css')}`);
  if (count(html, '/assets/v6.js') !== 1) stop(`V6 JS ${rel}`, `expected 1 include, got ${count(html, '/assets/v6.js')}`);
  if (/\/assets\/v5\.js/i.test(html)) stop(`legacy V5 ${rel}`, 'v5.js still referenced');
  if (/<script\b[^>]*src=["'][^"']*(?:gsap|ScrollTrigger|lenis)[^"']*["']/i.test(html)) stop(`external motion ${rel}`, 'GSAP/ScrollTrigger/Lenis script still referenced');
}
if (files.length && !failures.some(x => /V6 CSS|V6 JS|legacy V5|external motion/.test(x))) ok('all pages use only the V6 experience layer');

const runtime = fs.existsSync(v6js) ? fs.readFileSync(v6js, 'utf8') : '';
for (const required of ['data-tobi-v6', 'Tobi', 'R&E Tour-Concierge', 'IntersectionObserver']) {
  if (!runtime.includes(required)) stop('Tobi/runtime', `required marker missing: ${required}`);
}
if (runtime && ['https://cdn.', 'jsdelivr', 'unpkg.com'].some(x => runtime.includes(x))) stop('runtime dependencies', 'external CDN dependency found in v6.js');
else if (runtime) ok('V6 runtime is dependency-free');

const reportPath = path.join(out, 'v6-build-report.json');
if (!fs.existsSync(reportPath)) stop('build report', 'missing');
else {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    if (report.version !== '6.0.0') stop('build report', 'unexpected version');
    else {
      ok(`media report: ${report.mediaLocalised}/${report.mediaTotal} localised`);
      if (process.env.RE_V6_OFFLINE !== '1' && Array.isArray(report.mediaFallbacks) && report.mediaFallbacks.length) stop('media localisation', `${report.mediaFallbacks.length} remote image fallback(s) remain`);
      else if (process.env.RE_V6_OFFLINE !== '1') ok('all R&E proxy media localised');
    }
  } catch (e) { stop('build report', `invalid JSON: ${e.message}`); }
}

if (failures.length) {
  console.error('\n[V6 QA] STOP-SHIP');
  failures.forEach(x => console.error(`  ✗ ${x}`));
  process.exit(1);
}
console.log('\n[V6 QA] PASS');
pass.forEach(x => console.log(`  ✓ ${x}`));
