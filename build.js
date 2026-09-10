const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const out = path.join(root, 'dist');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const files = [
  'index.html',
  'admin/index.html',
  'touren/andalusien/index.html',
  'assets/styles.css',
  'assets/app.js',
  'assets/tour.css',
  'assets/tour.js',
  'assets/admin.css',
  'assets/admin.js',
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml'
];

for (const file of files) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error(`Missing build input: ${file}`);
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

console.log(`Built Reisen & Erleben V2 → ${out}`);
