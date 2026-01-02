import { jsPDF } from "jspdf";
import type { IntakeReport } from "../types/report";
import {
  formatDateTime,
  formatDateForFilename,
  sanitizeFilename,
} from "../utils/formatters";

// PDF Constants
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Colors
const COLORS = {
  primary: [15, 118, 110] as [number, number, number], // teal-700
  text: [30, 41, 59] as [number, number, number], // slate-800
  muted: [100, 116, 139] as [number, number, number], // slate-500
  border: [203, 213, 225] as [number, number, number], // slate-300
  urgencyBg: {
    1: [220, 252, 231] as [number, number, number], // green-100
    2: [219, 234, 254] as [number, number, number], // blue-100
    3: [254, 249, 195] as [number, number, number], // yellow-100
    4: [255, 237, 213] as [number, number, number], // orange-100
    5: [254, 226, 226] as [number, number, number], // red-100
  },
  urgencyText: {
    1: [21, 128, 61] as [number, number, number], // green-700
    2: [29, 78, 216] as [number, number, number], // blue-700
    3: [161, 98, 7] as [number, number, number], // yellow-700
    4: [194, 65, 12] as [number, number, number], // orange-700
    5: [185, 28, 28] as [number, number, number], // red-700
  },
};

const URGENCY_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Routine",
  2: "Low",
  3: "Moderate",
  4: "Urgent",
  5: "Emergency",
};

/**
 * Generate a PDF from an intake report
 */
export function generateIntakeReportPDF(report: IntakeReport): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = MARGIN;

  // === HEADER ===
  y = drawHeader(doc, y, report);

  // === PATIENT & OWNER INFO ===
  y = drawPatientOwnerSection(doc, y, report);

  // === CHIEF COMPLAINT ===
  y = drawSection(doc, y, "Chief Complaint", report.chiefComplaint);

  // Add severity and duration
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    `Severity: ${capitalize(report.severity)} | Duration: ${report.duration}`,
    MARGIN,
    y
  );
  y += 8;

  // === SYMPTOMS ===
  y = drawBulletList(doc, y, "Symptoms", report.symptoms);

  // === MEDICAL HISTORY ===
  if (report.medicalHistory && report.medicalHistory !== "Not mentioned") {
    y = drawSection(doc, y, "Medical History", report.medicalHistory);
  }

  // === MEDICATIONS & ALLERGIES ===
  if (report.currentMedications.length > 0 || report.allergies.length > 0) {
    y = drawMedicationsAllergies(doc, y, report);
  }

  // === CLINICAL ASSESSMENT ===
  y = drawAssessmentSection(doc, y, report);

  // === RECOMMENDED ACTIONS ===
  if (report.recommendedActions.length > 0) {
    y = drawNumberedList(
      doc,
      y,
      "Recommended Actions",
      report.recommendedActions
    );
  }

  // === FOOTER ===
  drawFooter(doc);

  // Generate filename and save
  const dateStr = formatDateForFilename();
  const petName = sanitizeFilename(report.patient.name || "unknown");
  const filename = `VetTriage_${dateStr}_${petName}.pdf`;

  doc.save(filename);
}

function drawHeader(doc: jsPDF, y: number, report: IntakeReport): number {
  // Logo/Title
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("VetTriage", MARGIN, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Veterinary Intake Report", MARGIN + 50, 16);

  // Date/time on right
  doc.text(formatDateTime(), PAGE_WIDTH - MARGIN, 16, { align: "right" });

  y = 35;

  // Urgency badge
  const urgency = report.urgencyLevel;
  const badgeWidth = 45;
  const badgeX = PAGE_WIDTH - MARGIN - badgeWidth;

  doc.setFillColor(...COLORS.urgencyBg[urgency]);
  doc.roundedRect(badgeX, y - 5, badgeWidth, 10, 2, 2, "F");

  doc.setTextColor(...COLORS.urgencyText[urgency]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Urgency: ${URGENCY_LABELS[urgency]}`,
    badgeX + badgeWidth / 2,
    y + 1,
    { align: "center" }
  );

  return y + 15;
}

function drawPatientOwnerSection(
  doc: jsPDF,
  y: number,
  report: IntakeReport
): number {
  const colWidth = CONTENT_WIDTH / 2 - 5;

  // Patient Info Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(MARGIN, y, colWidth, 35, 2, 2, "F");

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT", MARGIN + 5, y + 7);

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const patientLines = [
    `Name: ${report.patient.name}`,
    `Species: ${report.patient.species} | Breed: ${report.patient.breed}`,
    `Age: ${report.patient.age} | Weight: ${report.patient.weight}`,
    `Sex: ${report.patient.sex}`,
  ];

  let lineY = y + 14;
  for (const line of patientLines) {
    doc.text(line, MARGIN + 5, lineY);
    lineY += 5;
  }

  // Owner Info Box
  const ownerX = MARGIN + colWidth + 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(ownerX, y, colWidth, 35, 2, 2, "F");

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("OWNER", ownerX + 5, y + 7);

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const ownerLines = [
    `Name: ${report.owner.name}`,
    `Phone: ${report.owner.phone}`,
    `Email: ${report.owner.email}`,
  ];

  lineY = y + 14;
  for (const line of ownerLines) {
    doc.text(line, ownerX + 5, lineY);
    lineY += 5;
  }

  return y + 45;
}

function drawSection(
  doc: jsPDF,
  y: number,
  title: string,
  content: string
): number {
  // Check if we need a new page
  if (y > PAGE_HEIGHT - 50) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 6;

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const lines = doc.splitTextToSize(content, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y);
  y += lines.length * 5 + 6;

  return y;
}

function drawBulletList(
  doc: jsPDF,
  y: number,
  title: string,
  items: string[]
): number {
  if (items.length === 0) return y;

  if (y > PAGE_HEIGHT - 50) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 6;

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  for (const item of items) {
    if (y > PAGE_HEIGHT - 20) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text("•", MARGIN, y);
    const lines = doc.splitTextToSize(item, CONTENT_WIDTH - 8);
    doc.text(lines, MARGIN + 5, y);
    y += lines.length * 5;
  }

  return y + 6;
}

function drawNumberedList(
  doc: jsPDF,
  y: number,
  title: string,
  items: string[]
): number {
  if (items.length === 0) return y;

  if (y > PAGE_HEIGHT - 50) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 6;

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  items.forEach((item, i) => {
    if (y > PAGE_HEIGHT - 20) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(`${i + 1}.`, MARGIN, y);
    const lines = doc.splitTextToSize(item, CONTENT_WIDTH - 10);
    doc.text(lines, MARGIN + 7, y);
    y += lines.length * 5;
  });

  return y + 6;
}

function drawMedicationsAllergies(
  doc: jsPDF,
  y: number,
  report: IntakeReport
): number {
  if (y > PAGE_HEIGHT - 40) {
    doc.addPage();
    y = MARGIN;
  }

  const colWidth = CONTENT_WIDTH / 2 - 5;

  // Medications
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CURRENT MEDICATIONS", MARGIN, y);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  let medY = y + 5;
  if (report.currentMedications.length > 0) {
    for (const med of report.currentMedications) {
      doc.text(`• ${med}`, MARGIN, medY);
      medY += 4;
    }
  } else {
    doc.text("None", MARGIN, medY);
    medY += 4;
  }

  // Allergies
  const allergyX = MARGIN + colWidth + 10;
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ALLERGIES", allergyX, y);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  let allergyY = y + 5;
  if (report.allergies.length > 0) {
    for (const allergy of report.allergies) {
      doc.text(`• ${allergy}`, allergyX, allergyY);
      allergyY += 4;
    }
  } else {
    doc.text("None known", allergyX, allergyY);
    allergyY += 4;
  }

  return Math.max(medY, allergyY) + 8;
}

function drawAssessmentSection(
  doc: jsPDF,
  y: number,
  report: IntakeReport
): number {
  if (y > PAGE_HEIGHT - 50) {
    doc.addPage();
    y = MARGIN;
  }

  // Highlighted box for assessment
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(...COLORS.primary);

  const assessmentLines = doc.splitTextToSize(
    report.assessment,
    CONTENT_WIDTH - 10
  );
  const boxHeight = assessmentLines.length * 5 + 15;

  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2, 2, "FD");

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CLINICAL ASSESSMENT", MARGIN + 5, y + 8);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(assessmentLines, MARGIN + 5, y + 15);

  return y + boxHeight + 8;
}

function drawFooter(doc: jsPDF): void {
  const y = PAGE_HEIGHT - 10;

  doc.setDrawColor(...COLORS.border);
  doc.line(MARGIN, y - 5, PAGE_WIDTH - MARGIN, y - 5);

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Generated by VetTriage", MARGIN, y);
  doc.text(
    "This report is AI-generated and should be reviewed by a veterinary professional.",
    PAGE_WIDTH - MARGIN,
    y,
    { align: "right" }
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
