// Builds downloads/translate-your-own-skills-worksheet.pdf
// Run: node scripts/generate-worksheet.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'downloads', 'translate-your-own-skills-worksheet.pdf');
const INK = '#16211D';
const MUTED = '#566659';
const ACCENT = '#7A5C24';
const RULE = '#C9D1CC';
const FILL = '#F2ECDF';

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 44, bottom: 44, left: 46, right: 46 },
  info: {
    Title: 'Translate Your Own Skills: a worksheet for service leavers',
    Author: 'Kelroy James',
    Subject: 'Translating Service logistics work into civilian language',
  },
});
doc.pipe(fs.createWriteStream(OUT));

const W = doc.page.width - 92;
const bottom = () => doc.page.height - doc.page.margins.bottom;

function ensure(h) {
  if (doc.y + h > bottom()) doc.addPage();
}
function heading(t) {
  ensure(40);
  doc.x = doc.page.margins.left;
  doc.moveDown(0.7);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(ACCENT).text(t.toUpperCase(), { characterSpacing: 1 });
  doc.moveDown(0.25);
}
function para(t, opts = {}) {
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 9.6).fillColor(opts.color || INK).text(t, { width: W, lineGap: 1.6 });
  doc.moveDown(opts.gap == null ? 0.45 : opts.gap);
}

// cols: array of widths (sum = W). rows: array of arrays. head: header cells.
function table(cols, head, rows, opts = {}) {
  const pad = 4;
  const rowHeight = (cells, font, size) => {
    doc.font(font).fontSize(size);
    return Math.max(...cells.map((c, i) => doc.heightOfString(c || ' ', { width: cols[i] - pad * 2 })), opts.minH || 0) + pad * 2;
  };
  const drawRow = (cells, font, size, fill, color) => {
    const h = rowHeight(cells, font, size);
    ensure(h + 2);
    const y = doc.y;
    let x = doc.page.margins.left;
    cells.forEach((c, i) => {
      if (fill) doc.rect(x, y, cols[i], h).fill(fill);
      doc.rect(x, y, cols[i], h).lineWidth(0.5).strokeColor(RULE).stroke();
      doc.font(font).fontSize(size).fillColor(color).text(c || '', x + pad, y + pad, { width: cols[i] - pad * 2 });
      x += cols[i];
    });
    doc.y = y + h;
    doc.x = doc.page.margins.left;
  };
  drawRow(head, 'Helvetica-Bold', 8.4, FILL, INK);
  rows.forEach((r) => drawRow(r, 'Helvetica', 8.8, null, INK));
  doc.moveDown(0.5);
}

// ---- Title
doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text('TRANSLATE YOUR OWN SKILLS', { width: W });
doc.moveDown(0.2);
doc.font('Helvetica').fontSize(11).fillColor(MUTED).text("A worksheet for service leavers who can't yet name what they've already been doing", { width: W });
doc.moveDown(0.6);
para('Much of what gets called "logistics", "engineering" or "admin" in Service life is, in civilian language, control ownership, verification, exception handling and compliance. Nobody hands you the translation on the way out. This worksheet is the exercise I ran on my own eighteen years, and you can run it on yours in about twenty minutes. A longer guide, with the Royal Navy role descriptions and the training translated, is at kelroyjames.com/service-leaver-translation-guide.');

heading('The method');
para('1. Write down one task you do routinely, and be specific, for example "checking a consignment against its paperwork before I sign for it".', { gap: 0.2 });
para('2. Ask what the task verifies, what would go wrong if it were skipped, and who relied on the result. This is the part that usually gets left out of a CV.', { gap: 0.2 });
para('3. Note any training or certificate that licensed you to do it, such as dangerous goods or a stores accounting course.', { gap: 0.2 });
para('4. Match it to the nearest civilian name. A plausible match is enough to start a conversation with a recruiter or hiring manager who knows the framework.');

heading('Worked example');
const C5 = [96, 96, 92, 92, W - 376];
table(C5, ['What I actually do', 'What it verifies', 'Who relied on it', 'Trained or certified?', 'Civilian name'], [
  ['Handover check before signing for equipment', 'The asset register matches the physical items before I accept liability for them', 'The next account holder; the officer reviewing the account', 'Stores accounting course', 'Custody transfer and handover certification; first-line control ownership (Three Lines Model)'],
  ['Stocktake variance investigation', 'Whether a discrepancy is a process failure, a recording error or a genuine loss', 'Finance; the Logistics Officer; independent inspectors', 'Stocktaking procedure', 'Root cause analysis; inventory existence and completeness testing (COSO control activities)'],
  ['Preparing dangerous goods for movement', 'That cargo is classified, packed, marked and documented to the regulations', 'Carriers, the receiving site and the regulator', 'IATA, IMDG or ADR training', 'Regulated goods compliance; statutory chain of custody'],
]);
para('The fuller list of fourteen worked rows, mapped against ISO 27001, ISO 19011, COSO and the Three Lines Model, is at kelroyjames.com/same-control-two-vocabularies.', { size: 8.8, color: MUTED });

heading('Your turn');
para('Fill in as many rows as you can before you stop to second-guess yourself. A rough answer you can refine later beats a blank row.', { gap: 0.3 });
table(C5, ['What I actually do', 'What it verifies', 'Who relied on it', 'Trained or certified?', 'Civilian name'], Array.from({ length: 8 }, () => ['', '', '', '', '']), { minH: 30 });

heading('If you are stuck: a rough starting point by trade area');
para('These are starting points, not answers. Your own task is always more specific than the trade area it sits in.', { gap: 0.3 });
table([108, 190, W - 298], ['Trade area', 'Common theme', 'Look towards'], [
  ['Supply and logistics', 'Custody, verification and reconciliation of physical assets against records', 'Inventory control, supply chain assurance, third-party risk, operational risk'],
  ['Engineering and maintenance', 'Scheduled inspection, defect reporting, sign-off before use', 'Quality assurance, ISO 9001 and ISO 27001 controls, operational risk'],
  ['Communications and IT', 'Access control, incident handling, system integrity checks', 'Information security, ISO 27001, IT risk'],
  ['Personnel and HR', 'Vetting, record integrity, conduct processes', 'HR compliance, people risk, controls'],
  ['Operations and planning', 'Contingency planning, exercise debrief, lessons-learned capture', 'Operational resilience, business continuity, enterprise risk'],
]);

heading('Evidence appendix: the Royal Navy Logistics roles as published');
para("The left column paraphrases the Royal Navy's own careers pages for the Logistics profession (royalnavy.mod.uk, read 21 October 2026). The right column is my translation. Where it is marked as my reading, the careers page does not say it.", { gap: 0.3 });
table([84, W - 84 - 190, 190], ['Role', 'What the careers page says', 'Civilian reading'], [
  ['Supply Chain Rating (entry)', 'Manages the delivery of vital stores and equipment to Navy personnel worldwide; trains to NVQ level, with an Intermediate Apprenticeship in Warehousing and Storage.', 'First-line inventory and supply control; receiving, issuing and recording stock.'],
  ['Leading Hand', 'Runs a stores account, and sources and allocates key equipment.', 'Personal accountability for an account of assets and its record (my reading).'],
  ['Petty Officer', 'Becomes a line manager, mentoring and supporting others.', 'Supervisory review of first-line work: maker-checker (my reading).'],
  ['Logistics Officer', 'Leads logistics teams across supply chain, personnel and finance, coordinating the movement of supplies and personnel worldwide.', 'Operational management across supply and finance.'],
]);
para('Engineering, warfare and healthcare are mapped as a first pass at kelroyjames.com/verified-not-self-reported, and have not been checked by people who held those jobs. If your trade needs correcting, or is not there yet, tell me your trade and rank: that is exactly the input I need.', { size: 8.8 });

ensure(60);
para('If you have filled this in and want a second pair of eyes on it, email me at kelroydbjames@gmail.com. I read every one. More at kelroyjames.com.', { size: 9 });
doc.moveDown(0.3);
doc.font('Helvetica-Bold').fontSize(8.6).fillColor(MUTED).text('Kelroy James: Supply Chain Assurance and Operational Risk', { width: W });
doc.font('Helvetica').fontSize(7.8).fillColor(MUTED).text("Views are my own and drawn from public sources. They do not represent the Royal Navy or the Ministry of Defence. This worksheet is a translation aid, not a compliance mapping.", { width: W });

doc.end();
doc.on('end', () => console.log('wrote', OUT));
