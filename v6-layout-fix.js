const fs = require('node:fs');
const path = require('node:path');
const cssPath = path.join(__dirname,'dist','assets','v6.css');
const fixPath = path.join(__dirname,'v6-layout-fix.css');
if (!fs.existsSync(cssPath)) throw new Error('STOP-SHIP: v6.css missing before layout guard');
if (!fs.existsSync(fixPath)) throw new Error('STOP-SHIP: v6-layout-fix.css missing');
fs.appendFileSync(cssPath, '\n\n' + fs.readFileSync(fixPath,'utf8') + '\n');
console.log('[V6.1] layout guard appended');
