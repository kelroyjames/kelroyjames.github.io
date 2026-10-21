// Builds downloads/chain-of-custody-audit-question-bank.pdf from scripts/question-bank-data.json
// Run: node scripts/generate-question-bank.js
// Needs Google Chrome (or set CHROME_PATH). Fonts are read from the repo's fonts folder.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'downloads', 'chain-of-custody-audit-question-bank.pdf');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'question-bank-data.json'), 'utf8'));
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const furl = (f) => 'file:///' + path.join(ROOT, 'fonts', f).replace(/\\/g, '/');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FOOT = 'CHAIN OF CUSTODY · THE SUPPLY CHAIN AUDIT QUESTION BANK';
const NEWSLETTER = 'https://chainofcustody.beehiiv.com/?utm_source=question-bank-pdf&utm_medium=pdf&utm_campaign=question-bank';

const css = `
@font-face{font-family:"Public Sans";src:url("${furl('publicsans-var.woff2')}") format("woff2");font-weight:100 900}
@font-face{font-family:"Spectral";src:url("${furl('spectral-400.woff2')}") format("woff2");font-weight:400}
@font-face{font-family:"Spectral";src:url("${furl('spectral-600.woff2')}") format("woff2");font-weight:600}
@font-face{font-family:"Spectral";src:url("${furl('spectral-700.woff2')}") format("woff2");font-weight:700}
@font-face{font-family:"IBM Plex Mono";src:url("${furl('plexmono-500.woff2')}") format("woff2");font-weight:500}
@page{size:A4;margin:16mm 16mm 18mm 16mm;@bottom-left{content:"${FOOT}";font:500 7pt "IBM Plex Mono",monospace;color:#6b776f;letter-spacing:.08em}@bottom-right{content:counter(page);font:500 8pt "IBM Plex Mono",monospace;color:#6b776f}}
@page cover{margin:0;@bottom-left{content:none}@bottom-right{content:none}}
:root{--ink:#16211D;--ink2:#3C4C46;--muted:#6b776f;--rule:#D2DAD5;--accent:#7A5C24;--soft:#F2ECDF;--dark:#0D1411}
*{box-sizing:border-box;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:"Public Sans",Arial,sans-serif;color:var(--ink);font-size:10pt;line-height:1.5}
h1,h2,h3{font-family:Spectral,Georgia,serif}
.mono{font-family:"IBM Plex Mono",monospace;font-weight:500;letter-spacing:.12em;text-transform:uppercase;font-size:7.5pt}
.cover{page:cover;height:297mm;background:var(--dark);color:#E4EAE6;padding:26mm 22mm;display:flex;flex-direction:column;justify-content:space-between;break-after:page}
.cover .kick{color:#C9A257}
.cover h1{font-size:44pt;line-height:1.05;font-weight:700;margin:14mm 0 8mm;color:#fff}
.cover .sub{font-size:13pt;line-height:1.5;color:#B6C4BD;max-width:130mm}
.stats{display:flex;gap:16mm;margin-top:14mm}
.stats div b{display:block;font-family:Spectral,serif;font-size:30pt;color:#C9A257;line-height:1}
.stats div span{font-family:"IBM Plex Mono",monospace;font-size:7pt;letter-spacing:.12em;color:#B6C4BD}
.cover .by{border-top:1px solid #293831;padding-top:6mm;color:#B6C4BD}
.cover .by b{color:#fff;font-size:12pt;display:block;margin-bottom:2mm}
.page{break-after:page}
.page:last-child{break-after:auto}
h2{font-size:22pt;line-height:1.15;margin:3mm 0 4mm;font-weight:700}
.lede{font-size:11pt;color:var(--ink2);max-width:150mm;margin-bottom:4mm}
p{margin-bottom:3mm;color:var(--ink2)}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:5mm 8mm;margin:6mm 0}
.step{border-top:2px solid var(--accent);padding-top:2.5mm}
.step .n{font-family:Spectral,serif;font-size:18pt;color:var(--accent);font-weight:700}
.step h3{font-size:12pt;margin:0 0 1mm}
.step p{font-size:9.5pt;margin:0}
.rate{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin:6mm 0}
.rate div{background:var(--soft);padding:3.5mm 4mm;border-radius:2mm}
.rate b{display:block;font-size:10.5pt;margin-bottom:1mm;color:var(--ink)}
.rate p{font-size:9pt;margin:0}
.areas{margin-top:6mm}
.areas div{display:flex;justify-content:space-between;align-items:baseline;padding:2.2mm 0;border-bottom:1px solid var(--rule)}
.areas .num{font-family:Spectral,serif;font-weight:700;color:var(--accent);font-size:13pt;width:12mm}
.areas .t{flex:1;font-family:Spectral,serif;font-size:12pt;font-weight:600}
.areas .c{font-family:"IBM Plex Mono",monospace;font-size:7pt;letter-spacing:.1em;color:var(--muted)}
.ahead .mono{color:var(--accent)}
.ahead h2{margin-top:1mm;font-size:19pt;margin-bottom:2mm}
.ahead .asub{font-size:10pt;color:var(--muted);margin-bottom:3.5mm;padding-bottom:2mm;border-bottom:2px solid var(--ink)}
.q{border:1px solid var(--rule);border-radius:2mm;padding:3mm 4.5mm;margin-bottom:3.2mm;break-inside:avoid}
.q .qid{font-family:"IBM Plex Mono",monospace;font-size:8pt;letter-spacing:.12em;color:var(--accent);font-weight:500}
.q h3{font-size:10.8pt;line-height:1.3;font-weight:600;margin:.6mm 0 2mm}
.cols{display:grid;grid-template-columns:1.6fr 1fr;gap:6mm}
.q .lab{font-family:"IBM Plex Mono",monospace;font-size:6.8pt;letter-spacing:.12em;color:var(--muted);margin-bottom:1.2mm}
.q ul{margin:0;padding-left:4.2mm}
.q li{font-size:8.6pt;line-height:1.38;color:var(--ink2);margin-bottom:.6mm}
.warn{background:var(--soft);border-left:2px solid var(--accent);padding:2mm 2.6mm;font-size:8.6pt;line-height:1.38;color:var(--ink)}
.anch{margin-top:2mm;font-size:7.2pt;color:var(--muted);line-height:1.45}
.anch b{font-family:"IBM Plex Mono",monospace;font-weight:500;letter-spacing:.08em}
table{width:100%;border-collapse:collapse;font-size:8.3pt;margin-top:3mm}
th,td{border:1px solid var(--rule);padding:1.4mm 1.8mm;vertical-align:middle}
th{background:var(--soft);font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:6.6pt;letter-spacing:.08em;text-align:left}
td.n{width:9mm;font-family:"IBM Plex Mono",monospace;color:var(--accent);font-size:7.6pt}
td.box{width:7mm;text-align:center}
td.box i{display:inline-block;width:3mm;height:3mm;border:1px solid var(--ink2)}
td.gap{width:34mm}td.own{width:24mm}td.due{width:16mm}
tr{break-inside:avoid}
.about h2{margin-bottom:3mm}
.about .box{background:var(--soft);padding:5mm;border-radius:2mm;margin:5mm 0}
.about .box h3{font-size:14pt;margin-bottom:2mm}
.small{font-size:8.3pt;color:var(--muted)}
a{color:inherit}
`;

const areaPages = data.areas.map((a) => `
<section class="page ahead">
  <div class="mono">AREA ${a.n} OF 7</div>
  <h2>${esc(a.title)}</h2>
  <div class="asub">${esc(a.sub)}</div>
  ${a.questions.map((x) => `<div class="q">
    <div class="qid">Q${x.id}</div>
    <h3>${esc(x.question)}</h3>
    <div class="cols">
      <div><div class="lab">EVIDENCE THAT ANSWERS IT</div><ul>${x.evidence.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>
      <div><div class="lab">WARNING SIGN</div><div class="warn">${esc(x.warning)}</div></div>
    </div>
    <div class="anch"><b>ANCHORED IN</b> · ${x.anchored.map(esc).join(' · ')}</div>
  </div>`).join('')}
</section>`).join('\n');

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>The Supply Chain Audit Question Bank</title><style>${css}</style></head><body>

<section class="cover">
  <div>
    <div class="mono kick">CHAIN OF CUSTODY · FREE RESOURCE</div>
    <h1>The supply chain<br>audit question<br>bank</h1>
    <p class="sub">Twenty-five questions an auditor would ask about your supplier records and the hand-offs between your teams, with the evidence that answers each one.</p>
    <div class="stats"><div><b>25</b><span>QUESTIONS</span></div><div><b>7</b><span>AREAS</span></div><div><b>1</b><span>WORKSHEET</span></div></div>
  </div>
  <div class="by"><b>Kelroy James</b><span class="mono">ISO/IEC 27001 · 42001 · 27701 LEAD AUDITOR TRAINED</span><br><span class="mono" style="color:#84948B">EDITION 1 · OCTOBER 2026</span></div>
</section>

<section class="page">
  <div class="mono" style="color:var(--accent)">HOW TO USE IT</div>
  <h2>A strong answer shows evidence. A weak answer describes intent.</h2>
  <p class="lede">Most supply chain controls fail quietly, at the point where a record stops matching the goods, the supplier or the team that is meant to act on it. These questions are written to find those points before a regulator, a customer or an auditor does.</p>
  <p>They are grouped into seven areas, from knowing who you buy from to correcting past errors. You don't need to use all twenty-five at once, and the most useful starting point is usually the area you are least sure about.</p>
  <div class="steps">
    <div class="step"><div class="n">1</div><h3>Pick an area</h3><p>Choose the four or five questions closest to a risk you already suspect.</p></div>
    <div class="step"><div class="n">2</div><h3>Sample real transactions</h3><p>Take ten recent shipments, suppliers or entries and test each question against them.</p></div>
    <div class="step"><div class="n">3</div><h3>Ask for the evidence</h3><p>Accept a document, a log or a record. A description of the process is where the work starts.</p></div>
    <div class="step"><div class="n">4</div><h3>Record the gap and an owner</h3><p>Use the worksheet at the back, with one named person and a date for every gap.</p></div>
  </div>
  <div class="mono" style="color:var(--accent);margin-top:6mm">RATING EACH ANSWER</div>
  <div class="rate">
    <div><b>Evidenced</b><p>The evidence exists, covers the sample and was produced without notice.</p></div>
    <div><b>Partly</b><p>Some evidence exists, but it misses part of the sample or is out of date.</p></div>
    <div><b>Not evidenced</b><p>The answer relies on intent, memory or another team's assurance.</p></div>
  </div>
  <div class="areas">${data.areas.map((a) => `<div><span class="num">${String(a.n).padStart(2, '0')}</span><span class="t">${esc(a.title)}</span><span class="c">${a.questions.length} QUESTIONS</span></div>`).join('')}</div>
</section>

${areaPages}

<section class="page">
  <div class="mono" style="color:var(--accent)">WORKSHEET</div>
  <h2>Gaps, owners and dates</h2>
  <p>Tick one box for each question tested: evidenced, partly, or not evidenced. Every gap gets one named owner and a date.</p>
  <table>
    <tr><th>NO.</th><th>QUESTION</th><th>E</th><th>P</th><th>N</th><th>GAP FOUND</th><th>OWNER</th><th>DUE</th></tr>
    ${data.worksheet.map((w) => `<tr><td class="n">Q${w.id}</td><td>${esc(w.label)}</td><td class="box"><i></i></td><td class="box"><i></i></td><td class="box"><i></i></td><td class="gap"></td><td class="own"></td><td class="due"></td></tr>`).join('\n    ')}
  </table>
  <p class="small" style="margin-top:3mm">E = evidenced, P = partly, N = not evidenced.</p>
</section>

<section class="page about">
  <div class="mono" style="color:var(--accent)">ABOUT</div>
  <h2>Chain of Custody</h2>
  <p>Chain of Custody is a weekly newsletter on governance, risk and compliance for supply chains, written from the first line of defence, where the controls actually get run. Each issue takes one story where the record and the reality may come apart, sets the audit question it raises, and adds four more reads from regulators, courts, law firms and the trade press.</p>
  <p>It also treats blockchain, AI and IoT as one infrastructure that has to be assured as one: IoT captures what physically happened, AI analyses it, and blockchain secures the record, each governed through its own management system standard, ISO/IEC 27701, ISO/IEC 42001 and ISO/IEC 27001.</p>
  <p>Kelroy James is a supply chain professional with Lead Auditor training in ISO/IEC 27001, ISO/IEC 42001 and ISO/IEC 27701.</p>
  <div class="box">
    <div class="mono" style="color:var(--accent);margin-bottom:2mm">IF THIS WAS USEFUL</div>
    <h3>Pass it to one colleague who runs a control you depend on.</h3>
    <p>They can get their own copy, and the weekly issue, at <a href="${NEWSLETTER}">chainofcustody.beehiiv.com</a></p>
  </div>
  <p class="small">This question bank is general information to support your own review. It is not legal advice, and the rules it refers to change; check the current position for your jurisdiction and business before relying on it. References to standards cite clause numbers and titles only, and the standards themselves are available from ISO and BSI.</p>
  <p class="small">Views are my own and drawn only from published sources. They don't represent the Royal Navy or the Ministry of Defence, and nothing here reproduces any organisation's internal policy, procedure or assurance output.</p>
  <p class="small">© 2026 Kelroy James. You may share this document unaltered with credit.</p>
</section>
</body></html>`;

const tmp = path.join(os.tmpdir(), 'question-bank-build.html');
fs.writeFileSync(tmp, html);
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000', `--print-to-pdf=${OUT}`, 'file:///' + tmp.replace(/\\/g, '/')], { stdio: 'ignore' });
console.log('wrote', OUT);
