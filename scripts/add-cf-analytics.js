// Adds (or removes) the Cloudflare Web Analytics beacon on every HTML page.
// Only needed if Cloudflare's one-click automatic setup does not inject it.
//
// Usage (token comes from Cloudflare dashboard > Analytics & Logs > Web Analytics > your site > JS snippet):
//   CF_WA_TOKEN=<token> node scripts/add-cf-analytics.js --dry-run
//   CF_WA_TOKEN=<token> node scripts/add-cf-analytics.js
//   node scripts/add-cf-analytics.js --remove
//
// The script is idempotent: a marker comment identifies the snippet, so
// running it again updates the token instead of adding a second beacon.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry-run');
const remove = process.argv.includes('--remove');
const token = process.env.CF_WA_TOKEN;
if (!remove && !/^[0-9a-f]{32}$/i.test(token || '')) {
  console.error('Set CF_WA_TOKEN to the 32-character site token from the Cloudflare snippet.');
  process.exit(1);
}

const MARK_START = '<!-- cf-web-analytics -->';
const MARK_END = '<!-- /cf-web-analytics -->';
const block = remove ? '' : `${MARK_START}<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${token}"}'></script>${MARK_END}\n`;
const existing = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}\\n?`, 'g');

const skip = new Set(['node_modules', 'private', '.git', 'images', 'fonts', 'downloads']);
function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!skip.has(e.name)) yield* htmlFiles(path.join(dir, e.name)); }
    else if (e.name.endsWith('.html')) yield path.join(dir, e.name);
  }
}

let changed = 0, unchanged = 0, noBody = [];
for (const f of htmlFiles(root)) {
  const src = fs.readFileSync(f, 'utf8');
  let out = src.replace(existing, '');
  if (!remove) {
    const i = out.lastIndexOf('</body>');
    if (i < 0) { noBody.push(path.relative(root, f)); continue; }
    out = out.slice(0, i) + block + out.slice(i);
  }
  if (out === src) { unchanged++; continue; }
  changed++;
  if (!dry) fs.writeFileSync(f, out);
}
console.log(`${dry ? '[dry run] would change' : 'changed'} ${changed} pages, ${unchanged} already up to date.`);
if (noBody.length) console.log('No </body> found in:', noBody.join(', '));
