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
    // An item is either a plain string or a [label, text] pair; the label is
    // set in bold so a reader scanning the page sees which area of the job
    // each bullet covers (shipment tracking, compliance and so on).
    for (const item of items) {
      const align = expand ? 'justify' : 'left';
      doc.font(FONT.reg).fontSize(F.body).fillColor(INK);
      if (Array.isArray(item)) {
        doc.text('•  ', { continued: true, width: contentWidth, align });
        doc.font(FONT.bold).text(item[0] + ': ', { continued: true });
        doc.font(FONT.reg).text(item[1], { width: contentWidth, align });
      } else {
        doc.text('•  ' + item, { width: contentWidth, align });
      }
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
        const flat = Array.isArray(item) ? item[0] + ': ' + item[1] : item;
        bulletsH += doc.heightOfString('•  ' + flat, { width: contentWidth });
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

  // Professional summary. Kept to about five lines at 12pt (KPMG feedback,
  // 30 Sept 2026): it captures the reader and names the areas the roles below
  // prove, but carries no figures, so no achievement is stated twice.
  sectionHeading('Professional Summary');
  doc.font(FONT.reg).fontSize(F.body).fillColor(INK).text(
    "Supply chain assurance professional with 18 years in Royal Navy logistics and global movements, following 12 years in critical national infrastructure. First-line control owner who leads account recovery after failed inspections, financial-control investigations and the loss reduction that follows. Leads and coaches teams through concurrent operational commitments, and delivers continuous improvement through Lean Six Sigma. Seeking supply chain assurance, operational controls and governance, risk and compliance roles.",
    { align: expand ? 'justify' : 'left' }
  );
  doc.moveDown(0.25 * SP);
  // One short line, tailored to the target roles (KPMG feedback: too many
  // skills, keep to the role). The full record stays on the skills page.
  doc.font(FONT.bold).fontSize(F.body).fillColor(INK).text('Core Skills: ', { continued: true, align: expand ? 'justify' : 'left' });
  doc.font(FONT.reg).fontSize(F.body).fillColor(INK).text(
    'Supply Chain Assurance | Operational Controls | First-Line Risk Ownership (1LOD) | Governance, Risk & Compliance | Root-Cause Analysis & Remediation | Lean Six Sigma | ISO/IEC 27001, 42001, 27701 Lead Auditor',
    { align: expand ? 'justify' : 'left' }
  );

  // Professional experience. Action-led bullets, each with a bold label for
  // the area of the job it covers so no two roles repeat the same
  // achievement. Earlier postings use problem, action, result.
  sectionHeading('Professional Experience');

  job('Petty Officer (Supply Chain Manager) - first-line control owner (1LOD)', 'Royal Navy, Front-Line Warship', 'May 2024 - September 2026', [
    ['Compliance Recovery', 'Led the remediation of a public sector account rated unsatisfactory at independent inspection, restoring full compliance within 12 months.'],
    ['Financial Control', 'Identified £2.4M in misallocated expenditure on an adjacent account by reviewing annual inventory demands, and led the root-cause analysis behind its correction.'],
    ['Loss Reduction', 'Cut financial liability by 80% by closing 15 loss cases through asset verification and investigation.'],
    ['Continuous Improvement', 'Redesigned first-line controls using ISO management-systems standards, Lean Six Sigma and the Three Lines Model; the recommendations went to the policy authority as a proposed policy instruction.'],
    ['Coaching & Development', 'Founded and led "Empowerment Day," a junior-rate coaching and development programme, adopted as recurring practice within the department.'],
  ]);
  jobGap();

  job('Petty Officer (Supply Chain and Global Movements)', 'Royal Navy, Wildcat Maritime Force', 'Apr 2022 - May 2024', [
    ['Asset Accountability', 'Consolidated a dispersed, effectively unauditable asset base into a single accountable holding and closed 14 major loss investigations through evidence-based reconciliation.'],
    ['Global Movements', 'Ran global movements coordination alongside stores accountability, covering international freight and customs documentation.'],
    ['Team Leadership', 'Led a nine-person team through concurrent operational commitments, including support to a £5M weapons trial; six of the nine have since been promoted.'],
    ['Delivery Under Pressure', 'Turned round a rejected compliance consignment in three days to protect a fixed external deadline, and recovered a mid-exercise equipment shortfall with three hours to spare.'],
  ]);
  jobGap();

  job('Section Head, Supply Chain (Petty Officer)', 'Royal Navy, Surface Flotilla Engineering Support', 'Jun 2021 - Apr 2022', [
    ['Financial Accountability', 'Signed as Tier 1 approver of record for stock and inventory valued between £10M and £25M.'],
    ['Compliance Assurance', 'Owned first-line compliance-tool testing across three ship classes from the point of promotion.'],
    ['Lean Delivery', 'Led the logistics workstream of a lean-maintenance pilot: £145,674 of stores handled with zero losses on return, and the highest rate of demands placed on time of any comparable support period that year.'],
    ['Innovation', 'Selected for the 12-week Percy Hobart Fellowship, a Defence innovation programme, and delivered a mentored capability project on consignment-tracking process redesign.'],
  ]);
  jobGap();

  job('Earlier Royal Navy Postings - Leadership, Assurance and Movements', 'Royal Navy, various units', '2008 - 2021', [
    ['Fleet Stores Coordination Cell, 2019', 'Provided 24/7 watchkeeping cover for fleet-wide defect logistics across three concurrent global commitments (WESTLANT 18, SAIF SAREEA 3, Exercise Trident Juncture); part of the five-person team awarded the Herbert Lott Efficiency Award.'],
    ['Fleet Diving Squadron', 'A high-readiness unit relied on external systems to locate its equipment. Led delivery of its own tracking capability under PRINCE2, from stakeholder mapping to customs-compliant procedures, ending a 200-mile round trip for consignment labels.'],
    ['Dangerous Goods Training', 'Delivered safety-critical dangerous goods training to EOD personnel and mentored colleagues ahead of Qualifying Courses without senior-rate oversight; awarded the Chief Naval Logistics Officer\'s Award (2018).'],
    ['NATO SHAPE, 2015-16', 'As the only Royal Navy rating in a tri-service unit, rebuilt a logistics account, including ammunition, that had failed Army assurance: established a Central Records Branch, new naming conventions and a new record template, restoring full compliance at the revisit within nine months.'],
    ['Falklands Islands', "As Low Value Procurement Officer, sole point of contact for the deployed unit's financial and asset compliance, cutting low-value transaction volume by 80%."],
  ]);
  jobGap();

  job('GIS Analyst & Infrastructure Planner - Critical National Infrastructure', 'St Vincent Electricity Services', '1996 - 2008', [
    ['GIS Mapping', 'Led the GPS geo-tagging of national grid infrastructure, the mapping work that underpinned an Esri Special Achievement in GIS award.'],
    ['Progression', 'Advanced over twelve years from front-line operations to infrastructure planning through self-directed development, in a critical national infrastructure environment.'],
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
