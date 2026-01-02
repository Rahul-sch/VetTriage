import { jsPDF } from "jspdf";
import type { IntakeReport, ConfidenceLevel } from "../types/report";
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
  confidenceHigh: [16, 185, 129] as [number, number, number], // emerald-500
  confidenceMedium: [245, 158, 11] as [number, number, number], // amber-500
  confidenceLow: [239, 68, 68] as [number, number, number], // red-500
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

function getConfidenceColor(level: ConfidenceLevel): [number, number, number] {
  switch (level) {
    case "high":
      return COLORS.confidenceHigh;
    case "medium":
      return COLORS.confidenceMedium;
    case "low":
      return COLORS.confidenceLow;
  }
}

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

  // === CONFIDENCE LEGEND ===
  y = drawConfidenceLegend(doc, y);

  // === PATIENT & OWNER INFO ===
  y = drawPatientOwnerSection(doc, y, report);

  // === CHIEF COMPLAINT ===
  y = drawSection(
    doc,
    y,
    "Chief Complaint",
    report.chiefComplaint.value,
    report.chiefComplaint.confidence.level
  );

  // Add severity and duration
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  // Defensive: handle invalid severity values
  const severityValue = report.severity.value;
  const isValidSeverity = 
    typeof severityValue === "string" && 
    (severityValue === "mild" || severityValue === "moderate" || severityValue === "severe" || severityValue === "critical");
  const severityDisplay = isValidSeverity ? capitalize(severityValue) : "Unknown";
  
  if (!isValidSeverity) {
    console.warn(`Invalid severity in PDF: ${severityValue}. Using 'Unknown'`);
  }
  
  doc.text(
    `Severity: ${severityDisplay} | Duration: ${report.duration.value || "Not mentioned"}`,
    MARGIN,
    y
  );
  y += 8;

  // === SYMPTOMS ===
  y = drawBulletList(
    doc,
    y,
    "Symptoms",
    report.symptoms.value,
    report.symptoms.confidence.level
  );

  // === MEDICAL HISTORY ===
  if (
    report.medicalHistory.value &&
    report.medicalHistory.value !== "Not mentioned"
  ) {
    y = drawSection(
      doc,
      y,
      "Medical History",
      report.medicalHistory.value,
      report.medicalHistory.confidence.level
    );
  }

  // === MEDICATIONS & ALLERGIES ===
  if (
    report.currentMedications.value.length > 0 ||
    report.allergies.value.length > 0
  ) {
    y = drawMedicationsAllergies(doc, y, report);
  }

  // === CLINICAL ASSESSMENT ===
  y = drawAssessmentSection(doc, y, report);

  // === RECOMMENDED ACTIONS ===
  if (report.recommendedActions.value.length > 0) {
    y = drawNumberedList(
      doc,
      y,
      "Recommended Actions",
      report.recommendedActions.value,
      report.recommendedActions.confidence.level
    );
  }

  // === FOOTER ===
  drawFooter(doc);

  // Generate filename and save
  const dateStr = formatDateForFilename();
  const petName = sanitizeFilename(report.patient.name.value || "unknown");
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

  // Urgency badge (defensive: handle invalid urgency values)
  const urgency = report.urgencyLevel.value;
  const isValidUrgency = typeof urgency === "number" && urgency >= 1 && urgency <= 5;
  const urgencyValue = isValidUrgency ? urgency : 3; // Default to moderate if invalid
  const urgencyLabel = isValidUrgency ? URGENCY_LABELS[urgencyValue] : "Unknown";
  
  if (!isValidUrgency) {
    console.warn(`Invalid urgency level in PDF: ${urgency}. Using default (3 - Moderate)`);
  }

  const badgeWidth = 45;
  const badgeX = PAGE_WIDTH - MARGIN - badgeWidth;

  doc.setFillColor(...COLORS.urgencyBg[urgencyValue]);
  doc.roundedRect(badgeX, y - 5, badgeWidth, 10, 2, 2, "F");

  doc.setTextColor(...COLORS.urgencyText[urgencyValue]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Urgency: ${urgencyLabel}`,
    badgeX + badgeWidth / 2,
    y + 1,
    { align: "center" }
  );

  return y + 15;
}

function drawConfidenceLegend(doc: jsPDF, y: number): number {
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text("AI Confidence:", MARGIN, y);

  const startX = MARGIN + 22;
  const dotSize = 2;
  const gap = 25;

  // High
  doc.setFillColor(...COLORS.confidenceHigh);
  doc.circle(startX, y - 1, dotSize, "F");
  doc.text("High", startX + 4, y);

  // Medium
  doc.setFillColor(...COLORS.confidenceMedium);
  doc.circle(startX + gap, y - 1, dotSize, "F");
  doc.text("Medium", startX + gap + 4, y);

  // Low
  doc.setFillColor(...COLORS.confidenceLow);
  doc.circle(startX + gap * 2, y - 1, dotSize, "F");
  doc.text("Low", startX + gap * 2 + 4, y);

  return y + 8;
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
    { text: `Name: ${report.patient.name.value}`, level: report.patient.name.confidence.level },
    { text: `Species: ${report.patient.species.value} | Breed: ${report.patient.breed.value}`, level: report.patient.species.confidence.level },
    { text: `Age: ${report.patient.age.value} | Weight: ${report.patient.weight.value}`, level: report.patient.age.confidence.level },
    { text: `Sex: ${report.patient.sex.value}`, level: report.patient.sex.confidence.level },
  ];

  let lineY = y + 14;
  for (const line of patientLines) {
    // Confidence dot
    doc.setFillColor(...getConfidenceColor(line.level));
    doc.circle(MARGIN + 3, lineY - 1, 1, "F");
    doc.setTextColor(...COLORS.text);
    doc.text(line.text, MARGIN + 6, lineY);
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
    { text: `Name: ${report.owner.name.value}`, level: report.owner.name.confidence.level },
    { text: `Phone: ${report.owner.phone.value}`, level: report.owner.phone.confidence.level },
    { text: `Email: ${report.owner.email.value}`, level: report.owner.email.confidence.level },
  ];

  lineY = y + 14;
  for (const line of ownerLines) {
    doc.setFillColor(...getConfidenceColor(line.level));
    doc.circle(ownerX + 3, lineY - 1, 1, "F");
    doc.setTextColor(...COLORS.text);
    doc.text(line.text, ownerX + 6, lineY);
    lineY += 5;
  }

  return y + 45;
}

function drawSection(
  doc: jsPDF,
  y: number,
  title: string,
  content: string,
  confidence?: ConfidenceLevel
): number {
  // Check if we need a new page
  if (y > PAGE_HEIGHT - 50) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  // Title with confidence dot
  if (confidence) {
    doc.setFillColor(...getConfidenceColor(confidence));
    doc.circle(MARGIN + 2, y - 1.5, 1.5, "F");
    doc.text(title.toUpperCase(), MARGIN + 6, y);
  } else {
    doc.text(title.toUpperCase(), MARGIN, y);
  }
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
  items: string[],
  confidence?: ConfidenceLevel
): number {
  if (items.length === 0) return y;

  if (y > PAGE_HEIGHT - 50) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  if (confidence) {
    doc.setFillColor(...getConfidenceColor(confidence));
    doc.circle(MARGIN + 2, y - 1.5, 1.5, "F");
    doc.text(title.toUpperCase(), MARGIN + 6, y);
  } else {
    doc.text(title.toUpperCase(), MARGIN, y);
  }
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
  items: string[],
  confidence?: ConfidenceLevel
): number {
  if (items.length === 0) return y;

  if (y > PAGE_HEIGHT - 50) {
    doc.addPage();
    y = MARGIN;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  if (confidence) {
    doc.setFillColor(...getConfidenceColor(confidence));
    doc.circle(MARGIN + 2, y - 1.5, 1.5, "F");
    doc.text(title.toUpperCase(), MARGIN + 6, y);
  } else {
    doc.text(title.toUpperCase(), MARGIN, y);
  }
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

  doc.setFillColor(...getConfidenceColor(report.currentMedications.confidence.level));
  doc.circle(MARGIN + 2, y - 1, 1.5, "F");
  doc.text("CURRENT MEDICATIONS", MARGIN + 6, y);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  let medY = y + 5;
  if (report.currentMedications.value.length > 0) {
    for (const med of report.currentMedications.value) {
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

  doc.setFillColor(...getConfidenceColor(report.allergies.confidence.level));
  doc.circle(allergyX + 2, y - 1, 1.5, "F");
  doc.text("ALLERGIES", allergyX + 6, y);

  doc.setTextColor(...COLORS.text);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  let allergyY = y + 5;
  if (report.allergies.value.length > 0) {
    for (const allergy of report.allergies.value) {
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
    report.assessment.value,
    CONTENT_WIDTH - 10
  );
  const boxHeight = assessmentLines.length * 5 + 15;

  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2, 2, "FD");

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  // Confidence dot for assessment
  doc.setFillColor(...getConfidenceColor(report.assessment.confidence.level));
  doc.circle(MARGIN + 4, y + 5, 1.5, "F");
  doc.text("CLINICAL ASSESSMENT", MARGIN + 8, y + 8);

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
    "AI-generated report with confidence indicators. Review by a veterinary professional recommended.",
    PAGE_WIDTH - MARGIN,
    y,
    { align: "right" }
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
