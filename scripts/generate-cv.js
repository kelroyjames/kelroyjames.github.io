// CV generator for kelroyjames.com
// Usage: node scripts/generate-cv.js
// Writes the public CV to downloads/kelroy-james-cv-public.pdf and the
// KPMG workshop copy to private/kelroy-james-cv-kpmg-workshop.pdf.
// Edit the data below, not the PDFs -- they are generated output.
//
// Note on the en dash: pdfkit's standard (non-embedded) Helvetica font
// does not reliably round-trip U+2013 through pdftotext-style text
// extraction, even though it renders correctly on screen. Every date
// range and dash in this file uses a plain hyphen surrounded by spaces
// (" - ") instead, which is unambiguous in any encoding.

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const BLUE = '#1F3864';
const INK = '#1a1a1a';
const MUTED = '#555555';
const RULE = '#c9c9c9';

function buildDoc({ outPath, includePhone, preparedFor }) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 42, bottom: 42, left: 48, right: 48 },
    bufferPages: true,
  });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  function rule() {
    doc.moveDown(0.15);
    const y = doc.y;
    doc.save().strokeColor(RULE).lineWidth(0.75)
      .moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke()
      .restore();
    doc.moveDown(0.4);
  }

  function sectionHeading(text) {
    doc.moveDown(0.55);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(BLUE).text(text.toUpperCase(), { characterSpacing: 0.5 });
    rule();
  }

  function jobHeading(role, org, dates) {
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(INK).text(role, { continued: false });
    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(MUTED).text(`${org}  |  ${dates}`);
    doc.moveDown(0.2);
  }

  function bullets(items) {
    // Deliberately a single flowing .text() call per bullet, with no
    // explicit x/y positioning. An earlier version drew the bullet
    // glyph and the bullet text as two separate positioned .text()
    // calls sharing one startY; when that Y landed near the bottom
    // margin, pdfkit could paginate between the two calls, stranding
    // the bullet glyph on the previous page and pushing the whole
    // document to an extra page. Flowing text avoids that failure
    // mode entirely, at the minor cost of wrapped lines not hanging
    // under the bullet.
    for (const item of items) {
      doc.font('Helvetica').fontSize(9.3).fillColor(INK);
      doc.text('•  ' + item, { width: contentWidth });
      doc.moveDown(0.1);
    }
    doc.moveDown(0.12);
  }

  // Header
  doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text('KELROY JAMES');
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(10.5).fillColor(BLUE)
    .text('Supply Chain Assurance (Logistics & Movements) | Operational Controls | Governance, Risk & Compliance');
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(9).fillColor(MUTED)
    .text(includePhone
      ? '07891 118595   |   kelroydbjames@gmail.com   |   linkedin.com/in/kelroy-james   |   kelroyjames.com'
      : 'kelroydbjames@gmail.com   |   linkedin.com/in/kelroy-james   |   kelroyjames.com');
  rule();

  // Professional summary
  sectionHeading('Professional Summary');
  doc.font('Helvetica').fontSize(9.3).fillColor(INK).text(
    "Public sector supply chain assurance professional with 18 years' Royal Navy experience across logistics and global movements, preceded by 12 years in critical national infrastructure. As a first-line control owner, led the investigation and remediation of an account rated unsatisfactory at independent inspection, restoring full compliance within 12 months. Separately, identified £2.4M in misallocated expenditure on an adjacent account through a review of annual inventory demands, and led the root-cause analysis that supported its correction. Experienced in financial controls, operational assurance and reporting to senior command. Seeking roles in supply chain assurance, operational controls and related governance, risk and compliance work."
  );
  doc.moveDown(0.25);
  doc.font('Helvetica-Bold').fontSize(9.3).fillColor(INK).text('Core Skills: ', { continued: true });
  doc.font('Helvetica').fontSize(9.3).fillColor(INK).text(
    'Supply Chain Assurance | Global Movements | Operational Controls | First-Line Risk Ownership (1LOD) | Financial Control, Root-Cause Analysis & Remediation | Senior Stakeholder and Command-Level Reporting | Governance, Risk & Compliance (GRC) | Public Sector Assurance & Compliance | Lean Six Sigma Green Belt (Continuous Improvement) | Team Coaching & Development | Concurrent Workstream Management | Three Lines Model | ISO/IEC 27001, 42001, 27701 Lead Auditor | Data-Driven Reporting (SQL, Python) | PRINCE2 Project Governance'
  );

  // Professional experience
  sectionHeading('Professional Experience');

  jobHeading('Petty Officer (Supply Chain)', 'Royal Navy', 'Sept 2026 - Present');
  bullets([
    'Between postings; next appointment as Movements Petty Officer with a specialist unit',
  ]);

  jobHeading('Petty Officer (Supply Chain Manager) - first-line control owner (1LOD)', 'Royal Navy, Front-Line Warship', 'May 2024 - September 2026');
  bullets([
    'Took over a public sector account rated unsatisfactory at independent inspection; led the remediation that restored full compliance within 12 months',
    'Identified £2.4M in misallocated expenditure on an adjacent account through a review of annual inventory demands, and led the root-cause analysis that supported its correction',
    'Briefed findings and control-redesign recommendations to the Logistics Officer, who took them forward to the policy authority as a proposed policy instruction',
    "Managed a varied, concurrent workload: financial-control investigation, asset verification and documentation remediation, and a data-quality rebuild for the unit's inventory system, each to its own plan, evidence standard and deadline",
    'Reduced financial liability on the same account by 80% by closing 15 loss cases through asset verification and investigation, alongside the inspection-finding reduction',
    'Assessed favourably against the wider peer group at the most recent appraisal',
    'Founded and led a standing junior-rate coaching and development programme, adopted as recurring practice within the department',
  ]);

  jobHeading('Petty Officer (Supply Chain and Global Movements)', 'Royal Navy, Wildcat Maritime Force', 'Apr 2022 - May 2024');
  bullets([
    'Consolidated a dispersed, effectively unauditable asset base into a single accountable holding, closing 14 major loss investigations through evidence-based reconciliation',
    "Held concurrent responsibility for the unit's global movements coordination, alongside stores accountability, covering international freight, customs documentation and multi-modal consignment tracking across deployed locations",
    'Led a nine-person team through concurrent operational commitments, including support to a £5M weapons trial; six of the nine have since been promoted',
    'Turned round a rejected compliance consignment in three days to protect a fixed external deadline, and recovered a mid-exercise equipment shortfall with three hours to spare',
  ]);

  jobHeading('Section Head, Supply Chain (Petty Officer)', 'Royal Navy, Surface Flotilla Engineering Support', 'Jun 2021 - Apr 2022');
  bullets([
    'Held first-line assurance responsibility for compliance-tool testing across three ship classes from the point of promotion',
    'Led the logistics workstream of a lean-maintenance pilot: £145,674 of stores handled with zero losses on return, and the highest rate of demands placed on time of any comparable support period that year',
    'Selected for a 12-week Defence innovation fellowship; delivered a project on consignment-tracking process redesign',
  ]);

  jobHeading('Earlier Royal Navy Postings - Assurance, Compliance and Movements', 'Royal Navy, various units', '2008 - 2021');
  bullets([
    'Selected for promotion to Petty Officer (Supply Chain) in October 2020; completed the Senior Rate Leadership Course and served within a Class Output Management Cell (Fleet Time Support Period) ahead of appointment as Section Head, Supply Chain in June 2021',
    'Deputised for full account ownership through an intensive pre-deployment compliance work-up; coordinated a safety-critical evolution with external regulatory stakeholders and no senior oversight',
    'Provided 24/7 watchkeeping cover for fleet-wide operational-defect logistics, supporting three concurrent, globally distributed operational commitments',
    "Designed and delivered a PRINCE2-governed consignment-tracking capability, removing a manual, error-prone workaround and sustaining operations across four nations; awarded the Chief Naval Logistics Officer's Award for the coaching and mentoring delivered alongside it",
    'Rated the strongest among peer Leading Hands across two reporting periods',
    // TODO(Kelroy): this achievement is attributed to a Falklands posting as
    // "LVP Officer", not the NATO multinational headquarters role -- need
    // the correct posting name, dates and context before restoring the
    // full bullet. Location claim removed pending that; figures kept as
    // previously confirmed.
    "Sole point of contact for a deployed unit's financial and asset compliance, managing a recurring procurement budget and cutting low-value transaction volume by 80%",
  ]);

  jobHeading('GIS Analyst & Infrastructure Planner - Critical National Infrastructure', 'St Vincent Electricity Services', '1996 - 2008');
  bullets([
    'Twelve years in a national utility, a critical national infrastructure environment, advancing from front-line operations to infrastructure planning through self-directed development',
    'Led GPS-based mapping of national grid infrastructure, underpinning an Esri Special Achievement in GIS award-winning system',
  ]);

  // Education & Qualifications
  sectionHeading('Education & Qualifications');
  bullets([
    'ISO/IEC 27001:2022, 42001:2023 & 27701:2025 Lead Auditor; Fellow of Management Systems Auditing (FellowMSA)',
    'Lean Six Sigma Green Belt (LSSGB), Star Global College of Workforce Development - Feb 2026',
    'MSc Supply Chain and Logistics Management (Defence Logistics Staff Course), University of Lincoln, accredited by CIPS, CILT and IEMA - in progress, Apr 2025 - Mar 2027; route to MCIPS',
    'MicroMasters, Supply Chain Management & Advanced Network Design, MIT Center for Transportation & Logistics - coursework complete (5 core courses + advanced elective); final exam November 2026',
    'MicroMasters, Predictive Analytics using Python, University of Edinburgh: 2021 - 2022',
    'BSc (Hons) Logistics and Operations Management, Aston University - 2:1',
    'Professional Award in Cyber Security & OSINT, Abertay University - Distinction',
  ]);
  doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED).text('Full certification record: kelroyjames.com/skills-expertise.html');

  // Supporting evidence
  sectionHeading('Supporting Evidence');
  doc.font('Helvetica').fontSize(9.3).fillColor(INK).text('Full case studies with methodology and evidence for every figure above: ', { continued: true });
  doc.font('Helvetica-Bold').text('kelroyjames.com');
  doc.moveDown(0.2);
  bullets([
    'Identifying £2.4M in Misallocated Funds - financial-control investigation and root-cause analysis on an adjacent account',
    'Restoring Control to a Failing Account - controls design and remediation following independent inspection findings, account taken from unsatisfactory to fully compliant',
    'Modernising Assurance Across Inspections - first-line control framework built on ISO management-systems standards, Lean Six Sigma and the Three Lines Model',
  ]);

  // Availability
  sectionHeading('Availability');
  doc.font('Helvetica').fontSize(9.3).fillColor(INK).text(
    'Serving until April 2028 (resettlement). Available now for informational conversations and structured veteran or service-leaver hiring routes ahead of full-time availability.'
  );

  if (preparedFor) {
    doc.moveDown(0.4);
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED).text(`Prepared for: ${preparedFor}`);
  }
  doc.moveDown(preparedFor ? 0 : 0.4);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED).text('Last Updated: September 2026');

  doc.end();
  return new Promise((resolve) => stream.on('finish', resolve));
}

(async () => {
  const repoRoot = path.resolve(__dirname, '..');
  const publicPath = path.join(repoRoot, 'downloads', 'kelroy-james-cv-public.pdf');
  const privateDir = path.join(repoRoot, 'private');
  const privatePath = path.join(privateDir, 'kelroy-james-cv-kpmg-workshop.pdf');

  if (!fs.existsSync(privateDir)) fs.mkdirSync(privateDir, { recursive: true });

  await buildDoc({ outPath: publicPath, includePhone: false, preparedFor: null });
  console.log('wrote', publicPath);

  await buildDoc({
    outPath: privatePath,
    includePhone: true,
    preparedFor: 'KPMG Service Leaver CV & Interview Skills Workshop, London, 29 September 2026',
  });
  console.log('wrote', privatePath);
})();
