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

function buildDoc({ outPath, includePhone, singleWebsiteLink, expand }) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: expand ? { top: 24, bottom: 22, left: 40, right: 40 } : { top: 42, bottom: 42, left: 48, right: 48 },
    bufferPages: true,
  });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // The KPMG workshop copy is printed and read on paper, so it uses real
  // embedded Arial (the formal, standard choice for a printed CV) at a
  // proper 12pt body size, rather than the site copy's condensed PDF-base14
  // Helvetica tuned for on-screen density.
  if (expand) {
    doc.registerFont('Body', 'C:\\Windows\\Fonts\\arial.ttf');
    doc.registerFont('Body-Bold', 'C:\\Windows\\Fonts\\arialbd.ttf');
    doc.registerFont('Body-Italic', 'C:\\Windows\\Fonts\\ariali.ttf');
  }
  const FONT = expand
    ? { reg: 'Body', bold: 'Body-Bold', italic: 'Body-Italic' }
    : { reg: 'Helvetica', bold: 'Helvetica-Bold', italic: 'Helvetica-Oblique' };

  // `expand` fills out the full two pages with more generous type and
  // spacing instead of leaving dead white space at the bottom of page
  // two -- used for the printed workshop copy, which is read on paper
  // rather than scanned on screen. SP scales every moveDown increment;
  // F holds the corresponding font sizes.
  const SP = expand ? 1 : 1;
  const F = expand
    ? { name: 24, subtitle: 13, contact: 11, section: 14, job: 13, org: 11, body: 12, fine: 10 }
    : { name: 20, subtitle: 10.5, contact: 9, section: 10.5, job: 10.5, org: 9.5, body: 9.3, fine: 8.5 };
  const CM = 28.3465; // points per centimetre
  function jobGap() {
    if (expand) doc.y += 5;
  }

  // Keeps a heading from being stranded alone at the bottom of a page:
  // forces a page break first if the heading plus at least one line of
  // whatever follows it would not both fit above the bottom margin.
  function ensureSpace(minHeight) {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + minHeight > bottom) doc.addPage();
  }

  const SEC_GAP = expand ? 0.35 : 0.55;
  const RULE_GAP1 = expand ? 0.08 : 0.15;
  const RULE_GAP2 = expand ? 0.2 : 0.4;

  function rule() {
    doc.moveDown(RULE_GAP1 * SP);
    const y = doc.y;
    doc.save().strokeColor(RULE).lineWidth(0.75)
      .moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke()
      .restore();
    doc.moveDown(RULE_GAP2 * SP);
  }

  function sectionHeading(text) {
    const upper = text.toUpperCase();
    doc.font(FONT.bold).fontSize(F.section);
    const headH = doc.heightOfString(upper, { width: contentWidth, characterSpacing: 0.5 });
    doc.font(FONT.reg).fontSize(F.body);
    const oneLine = doc.heightOfString('A', { width: contentWidth });
    const lh = doc.currentLineHeight(true);
    ensureSpace(SEC_GAP * SP * lh + headH + RULE_GAP1 * SP * lh + RULE_GAP2 * SP * lh + oneLine);

    doc.moveDown(SEC_GAP * SP);
    doc.font(FONT.bold).fontSize(F.section).fillColor(BLUE).text(upper, { characterSpacing: 0.5 });
    rule();
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
      doc.font(FONT.reg).fontSize(F.body).fillColor(INK);
      doc.text('•  ' + item, { width: contentWidth, align: expand ? 'justify' : 'left' });
      doc.moveDown(expand ? 0.04 : 0.1 * SP);
    }
    doc.moveDown(expand ? 0.06 : 0.12 * SP);
  }

  // Prints a job's heading, org/dates line and bullets as one atomic block.
  // On the KPMG copy the whole block is measured up front and pushed to a
  // fresh page together if it would otherwise split across the page break
  // partway through its bullets; the public copy keeps the lighter
  // heading-plus-one-line guarantee, since it already fits comfortably.
  function job(role, org, dates, items) {
    doc.font(FONT.bold).fontSize(F.job);
    const roleH = doc.heightOfString(role, { width: contentWidth });
    const orgText = `${org}  |  ${dates}`;
    doc.font(FONT.italic).fontSize(F.org);
    const orgH = doc.heightOfString(orgText, { width: contentWidth });
    doc.font(FONT.reg).fontSize(F.body);
    const lh = doc.currentLineHeight(true);
    const jobGapCoef = expand ? 0.1 : 0.2;

    if (expand) {
      let bulletsH = 0;
      for (const item of items) {
        bulletsH += doc.heightOfString('•  ' + item, { width: contentWidth });
        bulletsH += 0.04 * lh;
      }
      bulletsH += 0.06 * lh;
      ensureSpace(roleH + orgH + jobGapCoef * SP * lh + bulletsH);
    } else {
      const oneLine = doc.heightOfString('A', { width: contentWidth });
      ensureSpace(roleH + orgH + jobGapCoef * SP * lh + oneLine);
    }

    doc.font(FONT.bold).fontSize(F.job).fillColor(INK).text(role, { continued: false });
    doc.font(FONT.italic).fontSize(F.org).fillColor(MUTED).text(orgText);
    doc.moveDown(jobGapCoef * SP);
    bullets(items);
  }

  // Header
  doc.font(FONT.bold).fontSize(F.name).fillColor(INK).text('KELROY JAMES');
  doc.moveDown(0.15 * SP);
  doc.font(FONT.reg).fontSize(F.subtitle).fillColor(BLUE)
    .text('Supply Chain Assurance (Logistics & Movements) | Operational Controls | Governance, Risk & Compliance');
  doc.moveDown(0.15 * SP);
  doc.font(FONT.reg).fontSize(F.contact).fillColor(MUTED)
    .text(includePhone
      ? '07891 118595   |   kelroydbjames@gmail.com   |   linkedin.com/in/kelroy-james   |   kelroyjames.com'
      : 'kelroydbjames@gmail.com   |   linkedin.com/in/kelroy-james   |   kelroyjames.com');
  rule();

  // Professional summary
  sectionHeading('Professional Summary');
  doc.font(FONT.reg).fontSize(F.body).fillColor(INK).text(
    "Public sector supply chain assurance professional with 18 years' Royal Navy experience across logistics and global movements, preceded by 12 years in critical national infrastructure. As a first-line control owner, led the investigation and remediation of an account rated unsatisfactory at independent inspection, restoring full compliance within 12 months. Separately, identified £2.4M in misallocated expenditure on an adjacent account through a review of annual inventory demands, and led the root-cause analysis that supported its correction. Experienced in financial controls, operational assurance and reporting to senior command. Seeking roles in supply chain assurance, operational controls and related governance, risk and compliance work.",
    { align: expand ? 'justify' : 'left' }
  );
  doc.moveDown(0.25 * SP);
  doc.font(FONT.bold).fontSize(F.body).fillColor(INK).text('Core Skills: ', { continued: true });
  doc.font(FONT.reg).fontSize(F.body).fillColor(INK).text(
    'Supply Chain Assurance | Global Movements | Operational Controls | First-Line Risk Ownership (1LOD) | Financial Control, Root-Cause Analysis & Remediation | Senior Stakeholder and Command-Level Reporting | Governance, Risk & Compliance (GRC) | Public Sector Assurance & Compliance | Lean Six Sigma Green Belt (Continuous Improvement) | Team Coaching & Development | Concurrent Workstream Management | Three Lines Model | ISO/IEC 27001, 42001, 27701 Lead Auditor | Data-Driven Reporting (SQL, Python) | PRINCE2 Project Governance',
    { align: expand ? 'justify' : 'left' }
  );

  // Professional experience
  sectionHeading('Professional Experience');

  job('Petty Officer (Supply Chain Manager) - first-line control owner (1LOD)', 'Royal Navy, Front-Line Warship', 'May 2024 - September 2026', [
    'Took over a public sector account rated unsatisfactory at independent inspection; led the remediation that restored full compliance within 12 months.',
    'Identified £2.4M in misallocated expenditure on an adjacent account through a review of annual inventory demands, and led the root-cause analysis that supported its correction.',
    'Briefed findings and control-redesign recommendations to the Logistics Officer, who took them forward to the policy authority as a proposed policy instruction.',
    "Managed a varied, concurrent workload: financial-control investigation, asset verification and documentation remediation, and a data-quality rebuild for the unit's inventory system, each to its own plan, evidence standard and deadline.",
    'Reduced financial liability on the same account by 80% by closing 15 loss cases through asset verification and investigation, alongside the inspection-finding reduction.',
    'Assessed favourably against the wider peer group at the most recent appraisal.',
    'Founded and led "Empowerment Day," a standing junior-rate coaching and development programme, adopted as recurring practice within the department.',
  ]);
  jobGap();

  job('Petty Officer (Supply Chain and Global Movements)', 'Royal Navy, Wildcat Maritime Force', 'Apr 2022 - May 2024', [
    'Consolidated a dispersed, effectively unauditable asset base into a single accountable holding, closing 14 major loss investigations through evidence-based reconciliation.',
    "Held concurrent responsibility for the unit's global movements coordination, alongside stores accountability, covering international freight, customs documentation and multi-modal consignment tracking across deployed locations.",
    'Led a nine-person team through concurrent operational commitments, including support to a £5M weapons trial; six of the nine have since been promoted.',
    'Turned round a rejected compliance consignment in three days to protect a fixed external deadline, and recovered a mid-exercise equipment shortfall with three hours to spare.',
  ]);
  jobGap();

  job('Section Head, Supply Chain (Petty Officer)', 'Royal Navy, Surface Flotilla Engineering Support', 'Jun 2021 - Apr 2022', [
    'Held Tier 1 signatory accountability (senior approver of record) for stock and inventory valued between £10M and £25M.',
    'Held first-line assurance responsibility for compliance-tool testing across three ship classes from the point of promotion.',
    'Led the logistics workstream of a lean-maintenance pilot: £145,674 of stores handled with zero losses on return, and the highest rate of demands placed on time of any comparable support period that year.',
    'Selected for a 12-week Defence innovation fellowship; delivered a project on consignment-tracking process redesign.',
  ]);
  jobGap();

  job('Earlier Royal Navy Postings - Assurance, Compliance and Movements', 'Royal Navy, various units', '2008 - 2021', [
    'Selected for promotion to Petty Officer (Supply Chain) in October 2020; completed the Senior Rate Leadership Course and served within a Class Output Management Cell (Fleet Time Support Period) ahead of appointment as Section Head, Supply Chain in June 2021.',
    'Deputised for full account ownership through an intensive pre-deployment compliance work-up; coordinated a safety-critical evolution with external regulatory stakeholders and no senior oversight.',
    'Provided 24/7 watchkeeping cover for fleet-wide operational-defect logistics, supporting three concurrent, globally distributed operational commitments.',
    "Designed and delivered a PRINCE2-governed consignment-tracking capability, removing a manual, error-prone workaround and sustaining operations across four nations; awarded the Chief Naval Logistics Officer's Award for the coaching and mentoring delivered alongside it.",
    'Rated the strongest among peer Leading Hands across two reporting periods.',
    "As Low Value Procurement Officer during a Falklands posting, sole point of contact for the deployed unit's financial and asset compliance, managing a recurring procurement budget and cutting low-value transaction volume by 80%.",
    'Restructured MOD inventory-accounting practice across a NATO multinational headquarters.',
  ]);
  jobGap();

  job('GIS Analyst & Infrastructure Planner - Critical National Infrastructure', 'St Vincent Electricity Services', '1996 - 2008', [
    'Twelve years in a national utility, a critical national infrastructure environment, advancing from front-line operations to infrastructure planning through self-directed development.',
    'Led GPS-based mapping of national grid infrastructure, underpinning an Esri Special Achievement in GIS award-winning system.',
  ]);

  // Education & Qualifications
  sectionHeading('Education & Qualifications');
  const educationItems = [
    'ISO/IEC 27001:2022, 42001:2023 & 27701:2025 Lead Auditor; Fellow of Management Systems Auditing (FellowMSA).',
    'Lean Six Sigma Green Belt (LSSGB), Star Global College of Workforce Development - Feb 2026.',
    'MSc Supply Chain and Logistics Management (Defence Logistics Staff Course), University of Lincoln, accredited by CIPS, CILT and IEMA - in progress, Apr 2025 - Mar 2027; route to MCIPS.',
    'MicroMasters, Supply Chain Management & Advanced Network Design, MIT Center for Transportation & Logistics - coursework complete (5 core courses + advanced elective).',
    'MicroMasters, Predictive Analytics using Python, University of Edinburgh: 2021 - 2022.',
    'BSc (Hons) Logistics and Operations Management, Aston University - 2:1.',
    'Professional Award in Cyber Security & OSINT, Abertay University - Distinction.',
  ];
  // KPMG copy only: pulled from the fuller "continuing education" list on
  // skills-expertise.html -- the two entries most likely to resonate with
  // a professional-services audience specifically.
  if (expand) {
    educationItems.push(
      'MBA Essentials, London School of Economics (Santander Scholarship) - 2025.',
      'Forward Program, McKinsey & Company - 2024.'
    );
  }
  bullets(educationItems);
  if (!singleWebsiteLink) {
    doc.font(FONT.italic).fontSize(F.fine).fillColor(MUTED).text('Full certification record: kelroyjames.com/skills-expertise.html');
  }

  // Supporting evidence -- dropped from the expanded (KPMG) copy, which is
  // read in person rather than followed up online; it stays on the public
  // site CV, where the case-study links are the point.
  if (!expand) {
    sectionHeading('Supporting Evidence');
    if (singleWebsiteLink) {
      doc.font(FONT.reg).fontSize(F.body).fillColor(INK).text(
        'Full case studies with methodology and evidence for every figure above are published on the website linked at the top of this CV.'
      );
    } else {
      doc.font(FONT.reg).fontSize(F.body).fillColor(INK).text('Full case studies with methodology and evidence for every figure above: ', { continued: true });
      doc.font(FONT.bold).text('kelroyjames.com');
    }
    doc.moveDown(0.2 * SP);
    bullets([
      'Identifying £2.4M in Misallocated Funds - financial-control investigation and root-cause analysis on an adjacent account.',
      'Restoring Control to a Failing Account - controls design and remediation following independent inspection findings, account taken from unsatisfactory to fully compliant.',
      'Modernising Assurance Across Inspections - first-line control framework built on ISO management-systems standards, Lean Six Sigma and the Three Lines Model.',
    ]);
  }

  // Availability
  sectionHeading('Availability');
  doc.font(FONT.reg).fontSize(F.body).fillColor(INK).text(
    'Serving until April 2028 (resettlement). Available now for informational conversations and structured veteran or service-leaver hiring routes ahead of full-time availability.',
    { align: expand ? 'justify' : 'left' }
  );

  doc.moveDown(expand ? 0.15 : 0.4 * SP);
  doc.font(FONT.italic).fontSize(F.fine).fillColor(MUTED).text('Last Updated: September 2026');

  doc.end();
  return new Promise((resolve) => stream.on('finish', resolve));
}

(async () => {
  const repoRoot = path.resolve(__dirname, '..');
  const publicPath = path.join(repoRoot, 'downloads', 'kelroy-james-cv-public.pdf');
  const privateDir = path.join(repoRoot, 'private');
  const privatePath = path.join(privateDir, 'kelroy-james-cv-kpmg-workshop.pdf');

  if (!fs.existsSync(privateDir)) fs.mkdirSync(privateDir, { recursive: true });

  await buildDoc({ outPath: publicPath, includePhone: false, singleWebsiteLink: false, expand: false });
  console.log('wrote', publicPath);

  await buildDoc({
    outPath: privatePath,
    includePhone: true,
    singleWebsiteLink: true,
    expand: true,
  });
  console.log('wrote', privatePath);
})();
