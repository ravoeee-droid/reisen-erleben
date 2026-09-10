const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = __dirname;
const out = path.join(root, 'dist');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const compressed = [
  ['.source/index.html.gz', 'index.html'],
  ['.source/assets/styles.css.gz', 'assets/styles.css'],
  ['.source/admin/index.html.gz', 'admin/index.html'],
  ['.source/assets/admin.css.gz', 'assets/admin.css'],
  ['.source/assets/tour.css.gz', 'assets/tour.css'],
  ['.source/touren/andalusien/index.html.gz', 'touren/andalusien/index.html']
];

for (const [from, to] of compressed) {
  const target = path.join(out, to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, zlib.gunzipSync(fs.readFileSync(path.join(root, from))));
}

const copies = [
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'assets/app.js',
  'assets/admin.js',
  'assets/tour.js'
];

for (const file of copies) {
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file), target);
}

console.log(`Built Reisen & Erleben prototype → ${out}`);
