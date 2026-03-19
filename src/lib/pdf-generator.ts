import jsPDF from "jspdf";
import type { TravelReport, SafetyLevel } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";

// ── Layout constants ──────────────────────────────────────────────────────────
const W = 210; // A4 width (mm)
const H = 297; // A4 height (mm)
const M = 18; // margin
const CW = W - M * 2; // content width
const FOOTER_Y = H - 9;
const BOTTOM = FOOTER_Y - 5; // max y before page break

// ── Colors ────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C = {
  primaryBg: [30, 58, 138] as RGB,
  primary: [37, 99, 235] as RGB,
  body: [31, 41, 55] as RGB,
  muted: [107, 114, 128] as RGB,
  light: [249, 250, 251] as RGB,
  border: [209, 213, 219] as RGB,
  white: [255, 255, 255] as RGB,
  red: [220, 38, 38] as RGB,
  redBg: [254, 242, 242] as RGB,
  orange: [194, 65, 12] as RGB,
  orangeBg: [255, 247, 237] as RGB,
  green: [21, 128, 61] as RGB,
  greenBg: [240, 253, 244] as RGB,
};

function safetyColor(level: SafetyLevel): RGB {
  if (level === "RED") return C.red;
  if (level === "ORANGE") return C.orange;
  return C.green;
}

function safetyBgColor(level: SafetyLevel): RGB {
  if (level === "RED") return C.redBg;
  if (level === "ORANGE") return C.orangeBg;
  return C.greenBg;
}

// ── Guide ID ──────────────────────────────────────────────────────────────────
function generateGuideId(destination: string, departureDate: string): string {
  const dest = destination
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 5)
    .padEnd(5, "X");

  // departureDate is YYYY-MM-DD
  const [year, month, day] = departureDate.split("-");
  const ddmmyy = `${day}${month}${year.slice(2)}`;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i = 0; i < 6; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${dest}_${ddmmyy}_${rand}`;
}

// ── PDF Writer ────────────────────────────────────────────────────────────────
class PDFWriter {
  private doc: jsPDF;
  private y: number;
  private page: number;
  private guideId: string;

  constructor(guideId: string) {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.y = M;
    this.page = 1;
    this.guideId = guideId;
  }

  // ── Low-level helpers ──────────────────────────────────────────────────────

  private rgb(color: RGB) {
    this.doc.setTextColor(color[0], color[1], color[2]);
  }

  private fill(color: RGB) {
    this.doc.setFillColor(color[0], color[1], color[2]);
  }

  private draw(color: RGB) {
    this.doc.setDrawColor(color[0], color[1], color[2]);
  }

  private lineH(fontSize: number, spacing = 1.5): number {
    return (fontSize / 2.835) * spacing; // pt → mm with line spacing
  }

  // ── Page management ────────────────────────────────────────────────────────

  private drawFooter() {
    this.draw(C.border);
    this.doc.setLineWidth(0.25);
    this.doc.line(M, FOOTER_Y - 3, W - M, FOOTER_Y - 3);

    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "normal");
    this.rgb(C.muted);
    this.doc.text(`Guide ID: ${this.guideId}`, M, FOOTER_Y);
    this.doc.text(`Page ${this.page}`, W - M, FOOTER_Y, { align: "right" });
    this.doc.text(
      "Always verify safety info with official government travel advisories.",
      W / 2,
      FOOTER_Y,
      { align: "center" }
    );
  }

  private newPage() {
    this.doc.addPage();
    this.page++;
    this.y = M + 4;
    this.drawFooter();
  }

  private ensureSpace(needed: number) {
    if (this.y + needed > BOTTOM) this.newPage();
  }

  gap(mm: number) {
    this.y += mm;
  }

  // ── Text helpers ───────────────────────────────────────────────────────────

  text(
    content: string,
    fontSize: number,
    color: RGB,
    opts: { indent?: number; bold?: boolean; maxWidth?: number } = {}
  ) {
    const { indent = 0, bold = false, maxWidth = CW - (opts.indent ?? 0) } =
      opts;
    this.doc.setFontSize(fontSize);
    this.doc.setFont("helvetica", bold ? "bold" : "normal");
    this.rgb(color);

    const lines = this.doc.splitTextToSize(content, maxWidth);
    const lh = this.lineH(fontSize);
    this.ensureSpace(lines.length * lh + 1);
    this.doc.text(lines, M + indent, this.y);
    this.y += lines.length * lh + 0.5;
  }

  bullet(content: string, fontSize: number, color: RGB, indent = 4) {
    this.doc.setFontSize(fontSize);
    this.doc.setFont("helvetica", "normal");
    this.rgb(color);
    const bullet = "•  ";
    const lines = this.doc.splitTextToSize(content, CW - indent - 4);
    const lh = this.lineH(fontSize);
    this.ensureSpace(lines.length * lh + 0.5);
    this.doc.text(bullet + lines[0], M + indent, this.y);
    for (let i = 1; i < lines.length; i++) {
      this.y += lh;
      this.doc.text(lines[i], M + indent + 4, this.y);
    }
    this.y += lh + 0.5;
  }

  label(key: string, value: string, fontSize = 9, indent = 0) {
    const lh = this.lineH(fontSize);
    const keyW = this.doc.getStringUnitWidth(key + "  ") * fontSize / 2.835;
    this.ensureSpace(lh + 2);
    this.doc.setFontSize(fontSize);
    this.doc.setFont("helvetica", "bold");
    this.rgb(C.muted);
    this.doc.text(key + "  ", M + indent, this.y);
    this.doc.setFont("helvetica", "normal");
    this.rgb(C.body);
    const lines = this.doc.splitTextToSize(value, CW - indent - keyW - 2);
    this.doc.text(lines, M + indent + keyW, this.y);
    this.y += Math.max(lines.length, 1) * lh + 1;
  }

  // ── Structural helpers ─────────────────────────────────────────────────────

  sectionHeader(title: string) {
    this.ensureSpace(16);
    this.fill(C.primaryBg);
    this.doc.rect(M, this.y, CW, 9, "F");
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.rgb(C.white);
    this.doc.text(title, M + 4, this.y + 6.2);
    this.y += 12;
  }

  subHeader(title: string) {
    this.ensureSpace(12);
    this.fill(C.light);
    this.draw(C.border);
    this.doc.setLineWidth(0.25);
    this.doc.rect(M, this.y, CW, 7, "FD");
    this.doc.setFontSize(9.5);
    this.doc.setFont("helvetica", "bold");
    this.rgb(C.primaryBg);
    this.doc.text(title, M + 3, this.y + 5);
    this.y += 10;
  }

  divider() {
    this.ensureSpace(6);
    this.draw(C.border);
    this.doc.setLineWidth(0.2);
    this.doc.line(M, this.y, W - M, this.y);
    this.y += 4;
  }

  getDoc() {
    return this.doc;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateTravelPDF(
  report: TravelReport,
  formData: TravelFormValues
): void {
  const guideId = generateGuideId(formData.destination, formData.departureDate);
  const writer = new PDFWriter(guideId);
  const doc = writer.getDoc();

  // Draw footer on page 1 before we start adding content
  // (the PDFWriter draws footers on newPage() calls, but not on page 1)
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setLineWidth(0.25);
  doc.line(M, FOOTER_Y - 3, W - M, FOOTER_Y - 3);
  doc.text(`Guide ID: ${guideId}`, M, FOOTER_Y);
  doc.text("Page 1", W - M, FOOTER_Y, { align: "right" });
  doc.text(
    "Always verify safety info with official government travel advisories.",
    W / 2,
    FOOTER_Y,
    { align: "center" }
  );

  // ── Title block ─────────────────────────────────────────────────────────────
  doc.setFillColor(C.primaryBg[0], C.primaryBg[1], C.primaryBg[2]);
  doc.rect(M, M, CW, 24, "F");
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Travel Guide", M + 5, M + 11);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text(formData.destination, M + 5, M + 19.5);
  writer.gap(28);

  // ── Trip metadata box ───────────────────────────────────────────────────────
  doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
  doc.setFillColor(C.light[0], C.light[1], C.light[2]);
  doc.setLineWidth(0.3);
  doc.rect(M, writer["y"], CW, 26, "FD");

  const totalTravellers = formData.group.adults + formData.group.children;
  const groupDesc =
    formData.group.children > 0
      ? `${formData.group.type} · ${formData.group.adults} adult${formData.group.adults > 1 ? "s" : ""}, ${formData.group.children} child${formData.group.children > 1 ? "ren" : ""}`
      : `${formData.group.type} · ${totalTravellers} traveller${totalTravellers > 1 ? "s" : ""}`;

  const col2 = M + CW / 2;
  const rowY1 = writer["y"] + 7;
  const rowY2 = writer["y"] + 18;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  doc.text("TRIP DATES", M + 5, rowY1);
  doc.text("GROUP", col2 + 2, rowY1);
  doc.text("GUIDE ID", M + 5, rowY2);
  doc.text("GENERATED", col2 + 2, rowY2);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(C.body[0], C.body[1], C.body[2]);
  doc.setFontSize(9);
  doc.text(`${formData.departureDate}  →  ${formData.returnDate}`, M + 5, rowY1 + 5.5);
  doc.text(groupDesc, col2 + 2, rowY1 + 5.5);
  doc.text(guideId, M + 5, rowY2 + 5.5);
  doc.text(new Date().toLocaleString(), col2 + 2, rowY2 + 5.5);

  writer.gap(30);

  // ── Safety & Security ───────────────────────────────────────────────────────
  writer.sectionHeader("Safety & Security Status");

  const safety = report.safety;
  const sColor = safetyColor(safety.level);
  const sBg = safetyBgColor(safety.level);

  // Safety level badge
  writer["ensureSpace"](18);
  doc.setFillColor(sBg[0], sBg[1], sBg[2]);
  doc.setDrawColor(sColor[0], sColor[1], sColor[2]);
  doc.setLineWidth(0.4);
  doc.rect(M, writer["y"], CW, 14, "FD");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(sColor[0], sColor[1], sColor[2]);
  doc.text(`${safety.level} — ${safety.headline}`, M + 4, writer["y"] + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const summaryLines = doc.splitTextToSize(safety.summary, CW - 8);
  doc.text(summaryLines, M + 4, writer["y"] + 11.5);
  writer.gap(14 + summaryLines.length * 3);

  if (safety.specificRisks.length > 0) {
    writer.gap(2);
    writer.text("Specific Risks:", 9, C.body, { bold: true });
    for (const risk of safety.specificRisks) {
      writer.bullet(risk, 9, C.body);
    }
  }

  writer.gap(4);

  // ── Attractions ─────────────────────────────────────────────────────────────
  writer.sectionHeader("Attractions & Points of Interest");

  for (let i = 0; i < report.attractions.length; i++) {
    const a = report.attractions[i];

    writer["ensureSpace"](20);

    // Attraction header row
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.primaryBg[0], C.primaryBg[1], C.primaryBg[2]);
    doc.text(`${i + 1}.  ${a.name}`, M, writer["y"]);

    // Price badge (right-aligned)
    const priceColors: Record<string, RGB> = {
      FREE: C.green,
      BUDGET: C.primary,
      MODERATE: [161, 98, 7],
      EXPENSIVE: [194, 65, 12],
    };
    const pColor = priceColors[a.priceLevel] ?? C.muted;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(pColor[0], pColor[1], pColor[2]);
    doc.text(`${a.priceLevel}  ${a.priceNote}`, W - M, writer["y"], { align: "right" });
    writer.gap(5.5);

    // Category
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
    doc.text(a.category, M + 5, writer["y"]);
    writer.gap(4.5);

    // Description
    writer.text(a.description, 9, C.body, { indent: 4 });

    // Tips
    if (a.tips.length > 0) {
      writer.text("Tip: " + a.tips.join(" · "), 8.5, C.muted, { indent: 4 });
    }

    if (i < report.attractions.length - 1) {
      writer.divider();
    }
  }

  writer.gap(4);

  // ── Cuisine ─────────────────────────────────────────────────────────────────
  writer.sectionHeader("Local Cuisine & Dining");

  writer.subHeader("Must-Try Dishes");
  for (const dish of report.cuisine.mustTryDishes) {
    writer["ensureSpace"](14);
    writer.text(dish.name, 10, C.primaryBg, { bold: true });
    writer.text(dish.description, 9, C.body, { indent: 4 });
    writer.text(`Where to find: ${dish.whereToFind}`, 8.5, C.muted, { indent: 4 });
    writer.gap(2);
  }

  writer.subHeader("Restaurant Categories");
  for (const cat of report.cuisine.restaurantCategories) {
    writer["ensureSpace"](12);
    writer.label(cat.type, `${cat.priceRange} · ${cat.description}${cat.recommendation ? "  —  " + cat.recommendation : ""}`, 9);
  }

  writer.subHeader("Dining Customs & Tipping");
  for (const custom of report.cuisine.diningCustoms) {
    writer.bullet(custom, 9, C.body);
  }
  writer.text(`Tipping: ${report.cuisine.tippingGuidance}`, 9, C.body, { indent: 4 });

  writer.subHeader("Dietary Considerations");
  const d = report.cuisine.dietaryConsiderations;
  const flags = [
    d.vegetarianFriendly ? "Vegetarian-friendly" : "Limited vegetarian options",
    d.veganOptions ? "Vegan options available" : "Limited vegan options",
    d.halalAvailable ? "Halal available" : "Halal limited",
    d.kosherAvailable ? "Kosher available" : "Kosher limited",
  ];
  writer.text(flags.join("  ·  "), 8.5, C.body, { indent: 4 });
  if (d.commonAllergens.length > 0) {
    writer.text(`Common allergens: ${d.commonAllergens.join(", ")}`, 8.5, C.muted, { indent: 4 });
  }
  if (d.notes) {
    writer.text(d.notes, 8.5, C.body, { indent: 4 });
  }

  writer.gap(4);

  // ── Practical Information ───────────────────────────────────────────────────
  writer.sectionHeader("Practical Information");

  const p = report.practical;

  writer.subHeader("Currency");
  writer.label("Currency:", `${p.currency.name} (${p.currency.code})`);
  writer.text(p.currency.exchangeTip, 9, C.body, { indent: 4 });
  writer.text(p.currency.cashVsCard, 9, C.body, { indent: 4 });

  writer.subHeader("Transportation");
  writer.label("Driving:", `${p.transportation.drivingSide === "left" ? "Drive on the LEFT" : "Drive on the RIGHT"}${p.transportation.internationalLicenseRequired ? " · International licence required" : ""}`);
  writer.text(p.transportation.publicTransportSummary, 9, C.body, { indent: 4 });
  if (p.transportation.taxiRideshareApps.length > 0) {
    writer.text(`Apps: ${p.transportation.taxiRideshareApps.join(", ")}`, 8.5, C.muted, { indent: 4 });
  }

  writer.subHeader("Electricity");
  writer.text(`${p.electrical.voltage}  ·  Plug types: ${p.electrical.plugTypes.join(", ")}${p.electrical.adapterNeeded ? "  ·  Adapter needed" : ""}`, 9, C.body, { indent: 4 });

  writer.subHeader("Language");
  writer.label("Official language(s):", p.language.official.join(", "));
  writer.text(p.language.englishWidelySpoken ? "English widely spoken." : "English not widely spoken — local phrases useful.", 8.5, C.muted, { indent: 4 });
  if (p.language.usefulPhrases.length > 0) {
    writer.gap(2);
    writer.text("Useful Phrases:", 9, C.body, { bold: true, indent: 4 });
    for (const ph of p.language.usefulPhrases) {
      writer.text(`"${ph.phrase}"  →  ${ph.translation}`, 8.5, C.body, { indent: 8 });
    }
  }

  writer.subHeader("Weather & Packing");
  writer.label("Season:", `${p.weather.currentSeason} · ${p.weather.expectedConditions}`);
  for (const tip of p.weather.packingTips) {
    writer.bullet(tip, 8.5, C.body);
  }
  writer.text(`Best time to visit: ${p.weather.bestSeasons}`, 8.5, C.muted, { indent: 4 });
  if (p.weather.avoidSeasons) {
    writer.text(`Avoid: ${p.weather.avoidSeasons}`, 8.5, C.muted, { indent: 4 });
  }

  writer.subHeader("Emergency Contacts");
  writer.label("Police:", p.emergency.policeNumber, 9);
  writer.label("Ambulance:", p.emergency.ambulanceNumber, 9);
  if (p.emergency.touristPolice) {
    writer.label("Tourist Police:", p.emergency.touristPolice, 9);
  }
  writer.text(p.emergency.embassyTip, 9, C.muted, { indent: 4 });

  writer.subHeader("Visa");
  writer.text(p.visa.requiredForCommonPassports, 9, C.body, { indent: 4 });
  writer.text(p.visa.processingNote, 8.5, C.muted, { indent: 4 });

  writer.subHeader("Cultural Customs");
  for (const custom of p.culturalCustoms) {
    writer.bullet(custom, 9, C.body);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const safeDest = formData.destination.replace(/[^a-zA-Z0-9]/g, "");
  const dateStr = formData.departureDate;
  doc.save(`TravelGuide_${safeDest}_${dateStr}.pdf`);
}
