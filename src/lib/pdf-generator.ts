import jsPDF from "jspdf";
import type { TravelReport, SafetyLevel, Attraction } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";

// ── Layout ─────────────────────────────────────────────────────────────────────
const W = 210;
const H = 297;
const M = 18;
const CW = W - M * 2; // 174 mm
const FOOTER_Y = H - 8;
const BOTTOM = FOOTER_Y - 4;

// ── Colors ─────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C = {
  navy:         [33, 64, 104]   as RGB,
  orange:       [190, 95, 25]   as RGB,
  white:        [255, 255, 255] as RGB,
  body:         [45, 45, 45]    as RGB,
  muted:        [115, 115, 115] as RGB,
  border:       [200, 205, 210] as RGB,
  beige:        [255, 248, 220] as RGB,
  beigeB:       [215, 195, 140] as RGB,
  lightBlue:    [232, 242, 255] as RGB,
  lightBlueB:   [190, 215, 245] as RGB,
  yellowTip:    [255, 252, 210] as RGB,
  yellowTipB:   [215, 205, 140] as RGB,
  // Price badge colors
  badgeFreeB:   [21, 130, 65]   as RGB,
  badgeFreeBg:  [225, 255, 235] as RGB,
  badgeBudgB:   [37, 99, 200]   as RGB,
  badgeBudgBg:  [225, 238, 255] as RGB,
  badgeModB:    [160, 100, 10]  as RGB,
  badgeModBg:   [255, 245, 215] as RGB,
  badgeExpB:    [175, 45, 80]   as RGB,
  badgeExpBg:   [255, 225, 235] as RGB,
  // Safety
  red:          [200, 30, 30]   as RGB,
  redBg:        [255, 235, 235] as RGB,
  safeOrange:   [185, 95, 5]    as RGB,
  safeOrangeBg: [255, 245, 225] as RGB,
  green:        [21, 130, 65]   as RGB,
  greenBg:      [225, 255, 235] as RGB,
};

function lh(fontSize: number, spacing = 1.45): number {
  return (fontSize / 2.835) * spacing;
}

function safetyColors(level: SafetyLevel): { fg: RGB; bg: RGB; label: string } {
  if (level === "RED")    return { fg: C.red,         bg: C.redBg,        label: "HIGH RISK" };
  if (level === "ORANGE") return { fg: C.safeOrange,  bg: C.safeOrangeBg, label: "USE CAUTION" };
  return                         { fg: C.green,       bg: C.greenBg,      label: "SAFE TO TRAVEL" };
}

function badgeColors(priceLevel: string): { bg: RGB; border: RGB } {
  switch (priceLevel) {
    case "FREE":      return { bg: C.badgeFreeBg, border: C.badgeFreeB };
    case "BUDGET":    return { bg: C.badgeBudgBg, border: C.badgeBudgB };
    case "MODERATE":  return { bg: C.badgeModBg,  border: C.badgeModB  };
    case "EXPENSIVE": return { bg: C.badgeExpBg,  border: C.badgeExpB  };
    default:          return { bg: [240,240,240] as RGB, border: C.muted };
  }
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

// ── Guide ID ───────────────────────────────────────────────────────────────────
export function generateGuideId(destination: string, departureDate: string): string {
  const dest = destination
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 5)
    .padEnd(5, "X");
  const [year, month, day] = departureDate.split("-");
  const ddmmyy = `${day}${month}${year.slice(2)}`;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${dest}_${ddmmyy}_${rand}`;
}

// ── PDF Writer ─────────────────────────────────────────────────────────────────
class PDFWriter {
  private doc: jsPDF;
  private y: number;
  private pageNum: number;

  constructor() {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.y = M;
    this.pageNum = 1;
  }

  getDoc()  { return this.doc; }
  getY()    { return this.y; }
  setY(v: number) { this.y = v; }
  gap(mm: number) { this.y += mm; }

  private newPage() {
    this.doc.addPage();
    this.pageNum++;
    this.y = M + 2;
  }

  ensureSpace(needed: number) {
    if (this.y + needed > BOTTOM) this.newPage();
  }

  // Add footers on all pages at the end
  drawAllFooters(guideId: string) {
    const total = this.doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      this.doc.setPage(p);
      this.doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
      this.doc.setLineWidth(0.2);
      this.doc.line(M, FOOTER_Y - 3, W - M, FOOTER_Y - 3);
      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
      this.doc.text(`Guide ID: ${guideId}`, M, FOOTER_Y);
      this.doc.text(`Page ${p} / ${total}`, W - M, FOOTER_Y, { align: "right" });
      this.doc.text(
        "Always verify safety info with official government travel advisories.",
        W / 2, FOOTER_Y, { align: "center" }
      );
    }
  }

  // ── Text helpers ─────────────────────────────────────────────────────────────

  text(
    content: string,
    fontSize: number,
    color: RGB,
    opts: { indent?: number; bold?: boolean; italic?: boolean; maxWidth?: number } = {}
  ) {
    const { indent = 0, bold = false, italic = false, maxWidth } = opts;
    const mw = maxWidth ?? (CW - indent);
    this.doc.setFontSize(fontSize);
    this.doc.setFont("helvetica", italic ? "italic" : bold ? "bold" : "normal");
    this.doc.setTextColor(color[0], color[1], color[2]);
    const lines = this.doc.splitTextToSize(content, mw);
    const lineH = lh(fontSize);
    this.ensureSpace(lines.length * lineH + 1);
    this.doc.text(lines, M + indent, this.y);
    this.y += lines.length * lineH + 1;
  }

  bullet(content: string, fontSize = 9, color: RGB = C.body, indent = 4) {
    const mw = CW - indent - 5;
    this.doc.setFontSize(fontSize);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(color[0], color[1], color[2]);
    const lines = this.doc.splitTextToSize(content, mw);
    const lineH = lh(fontSize);
    this.ensureSpace(lines.length * lineH + 1);
    this.doc.text("- " + lines[0], M + indent, this.y);
    for (let i = 1; i < lines.length; i++) {
      this.y += lineH;
      this.doc.text(lines[i], M + indent + 4, this.y);
    }
    this.y += lineH + 0.5;
  }

  // ── Structural blocks ────────────────────────────────────────────────────────

  // Large destination title + orange date subtitle
  coverTitle(destination: string, dateRange: string, metaLine: string) {
    // Destination
    this.doc.setFontSize(34);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(C.navy[0], C.navy[1], C.navy[2]);
    this.doc.text(destination.toUpperCase(), M, this.y);
    this.y += lh(34, 1.15);

    // Date range in orange
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(C.orange[0], C.orange[1], C.orange[2]);
    this.doc.text(dateRange, M, this.y);
    this.y += lh(14, 1.3);

    // Italic meta
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "italic");
    this.doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
    this.doc.text(metaLine, M, this.y);
    this.y += lh(9, 1.3) + 3;

    // Bold divider
    this.doc.setDrawColor(C.navy[0], C.navy[1], C.navy[2]);
    this.doc.setLineWidth(0.7);
    this.doc.line(M, this.y, W - M, this.y);
    this.y += 5;
  }

  // Beige "Summary" box
  summaryBox(items: { label: string; value: string }[]) {
    const PAD = 5;
    const itemH = lh(9, 1.65);
    const titleH = lh(10, 1.4);
    const boxH = PAD + titleH + items.length * itemH + PAD;

    this.ensureSpace(boxH + 4);
    const bY = this.y;

    this.doc.setFillColor(C.beige[0], C.beige[1], C.beige[2]);
    this.doc.setDrawColor(C.beigeB[0], C.beigeB[1], C.beigeB[2]);
    this.doc.setLineWidth(0.35);
    this.doc.roundedRect(M, bY, CW, boxH, 2, 2, "FD");

    this.y = bY + PAD;
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(C.navy[0], C.navy[1], C.navy[2]);
    this.doc.text("TRIP SUMMARY", M + PAD, this.y);
    this.y += titleH;

    for (const { label, value } of items) {
      const labelW = this.doc.getStringUnitWidth(label + "  ") * 9 / 2.835;
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(C.orange[0], C.orange[1], C.orange[2]);
      this.doc.text(label + "  ", M + PAD, this.y);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(C.body[0], C.body[1], C.body[2]);
      const vLines = this.doc.splitTextToSize(value, CW - PAD * 2 - labelW);
      this.doc.text(vLines, M + PAD + labelW, this.y);
      this.y += itemH;
    }

    this.y = bY + boxH + 5;
  }

  // Navy section header bar with italic subtitle below
  sectionHeader(title: string, subtitle?: string) {
    const barH = 9;
    const subH = subtitle ? lh(8.5, 1.4) + 2 : 0;
    this.ensureSpace(barH + subH + 4);

    this.doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
    this.doc.rect(M, this.y, CW, barH, "F");

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(C.white[0], C.white[1], C.white[2]);
    this.doc.text(title.toUpperCase(), M + 4, this.y + 6.3);
    this.y += barH;

    if (subtitle) {
      this.doc.setFontSize(8.5);
      this.doc.setFont("helvetica", "italic");
      this.doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
      this.doc.text(subtitle, M + 3, this.y + lh(8.5) * 0.85);
      this.y += subH;
    }

    this.y += 4;
  }

  // Orange sub-heading (within a section)
  subHeading(title: string) {
    const h = lh(10, 1.3) + 2;
    this.ensureSpace(h + 2);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(C.orange[0], C.orange[1], C.orange[2]);
    this.doc.text(title, M, this.y);
    this.y += h;
  }

  // Inline yellow tip box
  tipBox(tip: string, indent = 0, maxW?: number) {
    const tipW = (maxW ?? CW) - indent;
    this.doc.setFontSize(8.5);
    this.doc.setFont("helvetica", "normal");
    const tipLines = this.doc.splitTextToSize("TIP: " + tip, tipW - 8);
    const boxH = tipLines.length * lh(8.5) + 5;
    this.ensureSpace(boxH + 2);

    this.doc.setFillColor(C.yellowTip[0], C.yellowTip[1], C.yellowTip[2]);
    this.doc.setDrawColor(C.yellowTipB[0], C.yellowTipB[1], C.yellowTipB[2]);
    this.doc.setLineWidth(0.25);
    this.doc.roundedRect(M + indent, this.y, tipW, boxH, 1.5, 1.5, "FD");

    this.doc.setTextColor(C.body[0], C.body[1], C.body[2]);
    this.doc.text(tipLines, M + indent + 4, this.y + 3.5);
    this.y += boxH + 3;
  }

  divider(lightGap = true) {
    this.ensureSpace(5);
    this.doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    this.doc.setLineWidth(0.2);
    this.doc.line(M, this.y, W - M, this.y);
    this.y += lightGap ? 4 : 2;
  }

  // ── Attraction card (3 columns) ───────────────────────────────────────────────
  attractionCard(a: Attraction, index: number) {
    const doc = this.doc;

    const L_W  = 18;   // left badge
    const R_W  = 42;   // right column
    const GAP  = 2;
    const CTR_W = CW - L_W - R_W - GAP * 2; // 110 mm
    const CTR_X = M + L_W + GAP;
    const R_X   = CTR_X + CTR_W + GAP;

    // ── Measure center column ──────────────────────────────────────────────────
    doc.setFontSize(10);
    const nameLines = doc.splitTextToSize(a.name, CTR_W - 4);
    const nameH = nameLines.length * lh(10, 1.3);

    doc.setFontSize(8);
    const catH = lh(8, 1.4);

    doc.setFontSize(9);
    const descLines = doc.splitTextToSize(a.description, CTR_W - 4);
    const descH = descLines.length * lh(9, 1.4);

    let tipH = 0;
    let tipLines: string[] = [];
    if (a.tips.length > 0) {
      doc.setFontSize(8.5);
      tipLines = doc.splitTextToSize("TIP: " + a.tips[0], CTR_W - 12);
      tipH = tipLines.length * lh(8.5) + 5 + 3; // box + gap
    }

    const centerH = 4 + nameH + catH + 2 + descH + (tipH > 0 ? 2 + tipH : 0) + 4;

    // ── Measure right column ──────────────────────────────────────────────────
    doc.setFontSize(8.5);
    const priceNoteLines = doc.splitTextToSize(a.priceNote, R_W - 6);
    const priceNoteH = priceNoteLines.length * lh(8.5, 1.35);

    const relevant = a.relevantFor ?? [];
    const relevantH = relevant.length * lh(8.5, 1.4);
    const rightH = 4 + lh(7.5, 1.4) + relevantH + 4 + lh(7.5, 1.4) + priceNoteH + 4;

    const cardH = Math.max(centerH, rightH, 28);
    this.ensureSpace(cardH + 2);

    const cardY = this.y;
    const { bg: lBg, border: lBorder } = badgeColors(a.priceLevel);

    // ── Left badge ────────────────────────────────────────────────────────────
    doc.setFillColor(lBg[0], lBg[1], lBg[2]);
    doc.setDrawColor(lBorder[0], lBorder[1], lBorder[2]);
    doc.setLineWidth(0.3);
    doc.rect(M, cardY, L_W, cardH, "FD");

    // Index number (large)
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(lBorder[0], lBorder[1], lBorder[2]);
    doc.text(`${index + 1}`, M + L_W / 2, cardY + cardH / 2 - 3, { align: "center" });

    // Price level label (small, below)
    const pLabel = a.priceLevel === "EXPENSIVE" ? "PREM." : a.priceLevel.slice(0, 5);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(pLabel, M + L_W / 2, cardY + cardH / 2 + 4, { align: "center" });

    // ── Center column ─────────────────────────────────────────────────────────
    let cY = cardY + 4;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.orange[0], C.orange[1], C.orange[2]);
    doc.text(nameLines, CTR_X + 2, cY);
    cY += nameH;

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
    doc.text(a.category, CTR_X + 2, cY);
    cY += catH + 2;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.body[0], C.body[1], C.body[2]);
    doc.text(descLines, CTR_X + 2, cY);
    cY += descH;

    if (tipLines.length > 0) {
      cY += 2;
      const tbH = tipLines.length * lh(8.5) + 5;
      doc.setFillColor(C.yellowTip[0], C.yellowTip[1], C.yellowTip[2]);
      doc.setDrawColor(C.yellowTipB[0], C.yellowTipB[1], C.yellowTipB[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(CTR_X + 2, cY, CTR_W - 6, tbH, 1.5, 1.5, "FD");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(C.body[0], C.body[1], C.body[2]);
      doc.text(tipLines, CTR_X + 5, cY + 3.5);
    }

    // ── Right column ──────────────────────────────────────────────────────────
    doc.setFillColor(C.lightBlue[0], C.lightBlue[1], C.lightBlue[2]);
    doc.setDrawColor(C.lightBlueB[0], C.lightBlueB[1], C.lightBlueB[2]);
    doc.setLineWidth(0.3);
    doc.rect(R_X, cardY, R_W, cardH, "FD");

    let rY = cardY + 4;

    // "BEST FOR" label
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.navy[0], C.navy[1], C.navy[2]);
    doc.text("BEST FOR", R_X + 3, rY);
    rY += lh(7.5, 1.4);

    if (relevant.length > 0) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(C.body[0], C.body[1], C.body[2]);
      for (const tag of relevant) {
        const tagLines = doc.splitTextToSize("- " + tag, R_W - 6);
        doc.text(tagLines, R_X + 3, rY);
        rY += tagLines.length * lh(8.5, 1.4);
      }
    }

    rY += 3;

    // "PRICE" label
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.navy[0], C.navy[1], C.navy[2]);
    doc.text("PRICE", R_X + 3, rY);
    rY += lh(7.5, 1.4);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.body[0], C.body[1], C.body[2]);
    doc.text(priceNoteLines, R_X + 3, rY);

    // ── Bottom border line ────────────────────────────────────────────────────
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    doc.setLineWidth(0.2);
    doc.line(M, cardY + cardH, W - M, cardY + cardH);

    this.y = cardY + cardH + 3;
  }

  // Restaurant table
  restaurantTable(categories: TravelReport["cuisine"]["restaurantCategories"]) {
    const doc = this.doc;
    const COL1 = 48;
    const COL2 = 30;
    const COL3 = CW - COL1 - COL2;
    const rowH = 8;
    const headerH = 8;
    const totalH = headerH + categories.length * rowH;

    this.ensureSpace(totalH + 6);
    const tY = this.y;

    // Header
    doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
    doc.rect(M, tY, CW, headerH, "F");
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.white[0], C.white[1], C.white[2]);
    doc.text("TYPE", M + 3, tY + 5.5);
    doc.text("PRICE", M + COL1 + 3, tY + 5.5);
    doc.text("DESCRIPTION", M + COL1 + COL2 + 3, tY + 5.5);

    let rowY = tY + headerH;
    categories.forEach((cat, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(C.lightBlue[0], C.lightBlue[1], C.lightBlue[2]);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(M, rowY, CW, rowH, "F");

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.text(cat.type, M + 3, rowY + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(C.body[0], C.body[1], C.body[2]);
      doc.text(cat.priceRange, M + COL1 + 3, rowY + 5.5);

      const desc = cat.description + (cat.recommendation ? " — " + cat.recommendation : "");
      const truncated = desc.length > 65 ? desc.slice(0, 62) + "..." : desc;
      doc.text(truncated, M + COL1 + COL2 + 3, rowY + 5.5);

      rowY += rowH;
    });

    // Border
    doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
    doc.setLineWidth(0.3);
    doc.rect(M, tY, CW, totalH, "D");

    this.y = tY + totalH + 5;
  }

  // Closing italic orange line
  closingLine(text: string) {
    this.ensureSpace(12);
    this.y += 4;
    this.doc.setFontSize(9.5);
    this.doc.setFont("helvetica", "italic");
    this.doc.setTextColor(C.orange[0], C.orange[1], C.orange[2]);
    this.doc.text(text, W / 2, this.y, { align: "center" });
    this.y += lh(9.5, 1.4);
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

export function generateTravelPDF(
  report: TravelReport,
  formData: TravelFormValues,
  guideId?: string
): void {
  guideId ??= generateGuideId(formData.destination, formData.departureDate);

  const writer = new PDFWriter();
  const doc = writer.getDoc();

  const totalTravellers = formData.group.adults + formData.group.children;
  const groupDesc =
    formData.group.children > 0
      ? `${formData.group.type} · ${formData.group.adults} adult${formData.group.adults !== 1 ? "s" : ""}, ${formData.group.children} child${formData.group.children !== 1 ? "ren" : ""}`
      : `${formData.group.type} · ${totalTravellers} traveller${totalTravellers !== 1 ? "s" : ""}`;

  const dateRange = `${formatDate(formData.departureDate)} – ${formatDate(formData.returnDate)}`;

  // ── Page 1: Cover ────────────────────────────────────────────────────────────

  writer.coverTitle(
    formData.destination,
    dateRange,
    `AI-generated travel guide  ·  ${groupDesc}  ·  Guide: ${guideId}`
  );

  // Safety highlight on cover
  const safety = report.safety;
  const sc = safetyColors(safety.level);

  writer.ensureSpace(22);
  const sfY = writer.getY();
  doc.setFillColor(sc.bg[0], sc.bg[1], sc.bg[2]);
  doc.setDrawColor(sc.fg[0], sc.fg[1], sc.fg[2]);
  doc.setLineWidth(0.5);
  doc.rect(M, sfY, CW, 18, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(sc.fg[0], sc.fg[1], sc.fg[2]);
  doc.text(`SAFETY STATUS: ${sc.label}  —  ${safety.headline}`, M + 4, sfY + 6.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(sc.fg[0], sc.fg[1], sc.fg[2]);
  const sumLines = doc.splitTextToSize(safety.summary, CW - 8);
  doc.text(sumLines.slice(0, 2), M + 4, sfY + 12.5);
  writer.setY(sfY + 18 + 4);

  // Trip summary box
  writer.summaryBox([
    { label: "Dates:",     value: dateRange },
    { label: "Group:",     value: groupDesc },
    { label: "Duration:",  value: (() => {
        const dep = new Date(formData.departureDate);
        const ret = new Date(formData.returnDate);
        const days = Math.ceil((ret.getTime() - dep.getTime()) / 86400000);
        return `${days} day${days !== 1 ? "s" : ""}`;
      })()
    },
    { label: "Guide ID:",  value: guideId },
  ]);

  // ── Safety & Security Section ─────────────────────────────────────────────────
  writer.sectionHeader("Safety & Security", safety.headline);

  // Full safety details
  writer.ensureSpace(16);
  const sfY2 = writer.getY();
  doc.setFillColor(sc.bg[0], sc.bg[1], sc.bg[2]);
  doc.setDrawColor(sc.fg[0], sc.fg[1], sc.fg[2]);
  doc.setLineWidth(0.35);
  const allSumLines = doc.splitTextToSize(safety.summary, CW - 8);
  const safeBoxH = allSumLines.length * lh(9) + 8;
  doc.rect(M, sfY2, CW, safeBoxH, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(sc.fg[0], sc.fg[1], sc.fg[2]);
  doc.text(allSumLines, M + 4, sfY2 + 5.5);
  writer.setY(sfY2 + safeBoxH + 4);

  if (safety.specificRisks.length > 0) {
    writer.text("Specific Risks:", 9, C.body, { bold: true });
    for (const risk of safety.specificRisks) {
      writer.bullet(risk, 9, C.body);
    }
  }
  writer.gap(3);

  // ── Attractions Section ───────────────────────────────────────────────────────
  writer.sectionHeader("Attractions & Points of Interest", `${report.attractions.length} recommended highlights`);

  for (let i = 0; i < report.attractions.length; i++) {
    writer.attractionCard(report.attractions[i], i);
  }
  writer.gap(2);

  // ── Cuisine & Dining Section ──────────────────────────────────────────────────
  writer.sectionHeader("Local Cuisine & Dining");

  writer.subHeading("Must-Try Dishes");
  for (const dish of report.cuisine.mustTryDishes) {
    writer.ensureSpace(20);
    writer.text(dish.name, 10, C.navy, { bold: true });
    writer.text(dish.description, 9, C.body, { indent: 4 });
    writer.text("Where to find: " + dish.whereToFind, 8.5, C.muted, { indent: 4 });
    writer.gap(2);
  }

  writer.gap(2);
  writer.subHeading("Restaurant Guide");
  writer.restaurantTable(report.cuisine.restaurantCategories);

  writer.subHeading("Dining Customs");
  for (const custom of report.cuisine.diningCustoms) {
    writer.bullet(custom, 9, C.body);
  }
  writer.text("Tipping: " + report.cuisine.tippingGuidance, 9, C.body, { indent: 4 });
  writer.gap(2);

  // Dietary info box
  const d = report.cuisine.dietaryConsiderations;
  const dietFlags: string[] = [];
  if (d.vegetarianFriendly) dietFlags.push("Vegetarian-friendly");
  if (d.veganOptions)        dietFlags.push("Vegan options available");
  if (d.halalAvailable)      dietFlags.push("Halal available");
  if (d.kosherAvailable)     dietFlags.push("Kosher available");

  writer.ensureSpace(20);
  const dBoxY = writer.getY();
  const dBoxH = (dietFlags.length + (d.commonAllergens.length > 0 ? 1 : 0) + (d.notes ? 1 : 0)) * lh(8.5, 1.5) + 10;
  doc.setFillColor(C.beige[0], C.beige[1], C.beige[2]);
  doc.setDrawColor(C.beigeB[0], C.beigeB[1], C.beigeB[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(M, dBoxY, CW, dBoxH, 2, 2, "FD");

  writer.setY(dBoxY + 4);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.navy[0], C.navy[1], C.navy[2]);
  doc.text("DIETARY CONSIDERATIONS", M + 4, writer.getY());
  writer.setY(writer.getY() + lh(8.5, 1.5));

  doc.setFont("helvetica", "normal");
  doc.setTextColor(C.body[0], C.body[1], C.body[2]);
  if (dietFlags.length > 0) {
    doc.text(dietFlags.join("  ·  "), M + 4, writer.getY());
    writer.setY(writer.getY() + lh(8.5, 1.5));
  }
  if (d.commonAllergens.length > 0) {
    doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
    doc.text("Common allergens: " + d.commonAllergens.join(", "), M + 4, writer.getY());
    writer.setY(writer.getY() + lh(8.5, 1.5));
  }
  if (d.notes) {
    doc.setTextColor(C.body[0], C.body[1], C.body[2]);
    doc.text(d.notes, M + 4, writer.getY());
    writer.setY(writer.getY() + lh(8.5, 1.5));
  }
  writer.setY(dBoxY + dBoxH + 4);

  // ── Practical Information Section ─────────────────────────────────────────────
  writer.sectionHeader("Practical Information");

  const p = report.practical;

  writer.subHeading("Currency & Money");
  writer.text(`${p.currency.name} (${p.currency.code})`, 9.5, C.body, { bold: true });
  writer.text(p.currency.exchangeTip, 9, C.body, { indent: 4 });
  writer.text(p.currency.cashVsCard, 9, C.body, { indent: 4 });
  writer.gap(2);

  writer.subHeading("Getting Around");
  writer.text(
    `Driving: ${p.transportation.drivingSide === "left" ? "Keep LEFT" : "Keep RIGHT"}` +
    (p.transportation.internationalLicenseRequired ? " · International licence required" : ""),
    9, C.body, { indent: 4 }
  );
  writer.text(p.transportation.publicTransportSummary, 9, C.body, { indent: 4 });
  if (p.transportation.taxiRideshareApps.length > 0) {
    writer.text("Apps: " + p.transportation.taxiRideshareApps.join(", "), 8.5, C.muted, { indent: 4 });
  }
  writer.gap(2);

  writer.subHeading("Language");
  writer.text(
    "Official: " + p.language.official.join(", ") + (p.language.englishWidelySpoken ? "  ·  English widely spoken" : "  ·  Limited English"),
    9, C.body, { indent: 4 }
  );
  if (p.language.usefulPhrases.length > 0) {
    writer.gap(1);
    for (const ph of p.language.usefulPhrases) {
      writer.text(`"${ph.phrase}"  ->  ${ph.translation}`, 8.5, C.body, { indent: 6 });
    }
  }
  writer.gap(2);

  writer.subHeading("Weather & Packing");
  writer.text(
    `${p.weather.currentSeason}  ·  ${p.weather.expectedConditions}`,
    9, C.body, { indent: 4 }
  );
  for (const tip of p.weather.packingTips) {
    writer.bullet(tip, 8.5, C.body);
  }
  if (p.weather.bestSeasons) {
    writer.text("Best time to visit: " + p.weather.bestSeasons, 8.5, C.muted, { indent: 4 });
  }
  writer.gap(2);

  writer.subHeading("Electricity");
  writer.text(
    `${p.electrical.voltage}  ·  Plug types: ${p.electrical.plugTypes.join(", ")}` +
    (p.electrical.adapterNeeded ? "  ·  Adapter needed" : ""),
    9, C.body, { indent: 4 }
  );
  writer.gap(2);

  writer.subHeading("Visa Requirements");
  writer.text(p.visa.requiredForCommonPassports, 9, C.body, { indent: 4 });
  writer.text(p.visa.processingNote, 8.5, C.muted, { indent: 4 });
  writer.gap(2);

  writer.subHeading("Emergency Contacts");
  writer.ensureSpace(20);
  const emBoxY = writer.getY();
  const emRows = [
    ["Police", p.emergency.policeNumber],
    ["Ambulance", p.emergency.ambulanceNumber],
    ...(p.emergency.touristPolice ? [["Tourist Police", p.emergency.touristPolice]] : []),
  ];
  const emBoxH = emRows.length * lh(9, 1.6) + 10;
  doc.setFillColor(C.lightBlue[0], C.lightBlue[1], C.lightBlue[2]);
  doc.setDrawColor(C.lightBlueB[0], C.lightBlueB[1], C.lightBlueB[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(M, emBoxY, CW, emBoxH, 2, 2, "FD");
  writer.setY(emBoxY + 5);
  for (const [label, num] of emRows) {
    const lw = doc.getStringUnitWidth(label + ":  ") * 9 / 2.835;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.navy[0], C.navy[1], C.navy[2]);
    doc.text(label + ":  ", M + 4, writer.getY());
    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.body[0], C.body[1], C.body[2]);
    doc.text(num, M + 4 + lw, writer.getY());
    writer.setY(writer.getY() + lh(9, 1.6));
  }
  writer.setY(emBoxY + emBoxH + 3);
  writer.text(p.emergency.embassyTip, 8.5, C.muted, { indent: 4 });
  writer.gap(2);

  writer.subHeading("Cultural Customs");
  for (const custom of p.culturalCustoms) {
    writer.bullet(custom, 9, C.body);
  }
  writer.gap(2);

  // ── Closing line ─────────────────────────────────────────────────────────────
  writer.closingLine(`Have a wonderful trip to ${formData.destination}!`);

  // ── Footers on all pages ──────────────────────────────────────────────────────
  writer.drawAllFooters(guideId);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const safeDest = formData.destination.replace(/[^a-zA-Z0-9]/g, "");
  doc.save(`TravelGuide_${safeDest}_${formData.departureDate}.pdf`);
}
