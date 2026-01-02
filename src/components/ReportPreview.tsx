import { useEffect, useMemo } from "react";
import type { IntakeReport, ConfidentField, ConfidenceMetadata } from "../types/report";
import { DownloadButton } from "./DownloadButton";
import { EditableField } from "./EditableField";
import { EditableList } from "./EditableList";
import { ConfidenceIndicator, ConfidenceLegend, ConfidenceBar } from "./ConfidenceIndicator";
import { useEditableReport } from "../hooks/useEditableReport";

interface ReportPreviewProps {
  report: IntakeReport;
  /** Called when user edits the report (for persistence) */
  onReportEdit?: (editedReport: IntakeReport) => void;
}

export function ReportPreview({ report: initialReport, onReportEdit }: ReportPreviewProps) {
  const { report, isEdited, updateField, hasEdits, resetEdits } =
    useEditableReport(initialReport);

  // Calculate overall confidence score
  const overallConfidence = useMemo(() => {
    const scores = [
      report.patient.name.confidence.score,
      report.patient.species.confidence.score,
      report.chiefComplaint.confidence.score,
      report.symptoms.confidence.score,
      report.severity.confidence.score,
      report.assessment.confidence.score,
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [report]);

  // Notify parent when report is edited
  useEffect(() => {
    if (hasEdits && onReportEdit) {
      onReportEdit(report);
    }
  }, [report, hasEdits, onReportEdit]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header with urgency and download */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Intake Report</h2>
          <UrgencyBadge 
            level={report.urgencyLevel.value} 
            confidence={report.urgencyLevel.confidence}
          />
          {hasEdits && (
            <button
              onClick={resetEdits}
              className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
            >
              Reset edits
            </button>
          )}
        </div>
        <DownloadButton report={report} />
      </div>

      {/* Confidence overview */}
      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
        <ConfidenceBar score={overallConfidence} label="Overall Confidence" />
        <ConfidenceLegend />
      </div>

      {/* Edit instructions */}
      <p className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
        💡 Click any field to edit. Hover over indicators to see AI confidence notes.
      </p>

      {/* Patient Info Card */}
      <Card title="Patient Information">
        <InfoGrid>
          <ConfidentInfoItem
            label="Name"
            field={report.patient.name}
            isEdited={isEdited("patient.name")}
            onSave={(v) => updateField("patient.name", v)}
          />
          <ConfidentInfoItem
            label="Species"
            field={report.patient.species}
            isEdited={isEdited("patient.species")}
            onSave={(v) => updateField("patient.species", v)}
          />
          <ConfidentInfoItem
            label="Breed"
            field={report.patient.breed}
            isEdited={isEdited("patient.breed")}
            onSave={(v) => updateField("patient.breed", v)}
          />
          <ConfidentInfoItem
            label="Age"
            field={report.patient.age}
            isEdited={isEdited("patient.age")}
            onSave={(v) => updateField("patient.age", v)}
          />
          <ConfidentInfoItem
            label="Weight"
            field={report.patient.weight}
            isEdited={isEdited("patient.weight")}
            onSave={(v) => updateField("patient.weight", v)}
          />
          <ConfidentInfoItem
            label="Sex"
            field={report.patient.sex}
            isEdited={isEdited("patient.sex")}
            onSave={(v) => updateField("patient.sex", v)}
          />
        </InfoGrid>
      </Card>

      {/* Owner Info Card */}
      <Card title="Owner Information">
        <InfoGrid>
          <ConfidentInfoItem
            label="Name"
            field={report.owner.name}
            isEdited={isEdited("owner.name")}
            onSave={(v) => updateField("owner.name", v)}
          />
          <ConfidentInfoItem
            label="Phone"
            field={report.owner.phone}
            isEdited={isEdited("owner.phone")}
            onSave={(v) => updateField("owner.phone", v)}
          />
          <ConfidentInfoItem
            label="Email"
            field={report.owner.email}
            isEdited={isEdited("owner.email")}
            onSave={(v) => updateField("owner.email", v)}
          />
        </InfoGrid>
      </Card>

      {/* Chief Complaint */}
      <Card title="Chief Complaint" confidence={report.chiefComplaint.confidence}>
        <EditableField
          value={report.chiefComplaint.value}
          onSave={(v) => updateField("chiefComplaint", v)}
          isEdited={isEdited("chiefComplaint")}
          multiline
          className="text-slate-700"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SeverityBadge 
            severity={report.severity.value} 
            confidence={report.severity.confidence}
          />
          <span className="text-sm text-slate-500 flex items-center gap-1">
            Duration:{" "}
            <EditableField
              value={report.duration.value}
              onSave={(v) => updateField("duration", v)}
              isEdited={isEdited("duration")}
              className="inline text-sm"
            />
            <ConfidenceIndicator confidence={report.duration.confidence} />
          </span>
        </div>
      </Card>

      {/* Symptoms */}
      <Card title="Symptoms" confidence={report.symptoms.confidence}>
        <EditableList
          items={report.symptoms.value}
          onSave={(v) => updateField("symptoms", v)}
          isEdited={isEdited("symptoms")}
          placeholder="No symptoms recorded"
        />
      </Card>

      {/* Medical History */}
      <Card title="Medical History" confidence={report.medicalHistory.confidence}>
        <EditableField
          value={report.medicalHistory.value}
          onSave={(v) => updateField("medicalHistory", v)}
          isEdited={isEdited("medicalHistory")}
          multiline
          className="text-slate-700"
        />
      </Card>

      {/* Medications & Allergies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Current Medications" confidence={report.currentMedications.confidence}>
          <EditableList
            items={report.currentMedications.value}
            onSave={(v) => updateField("currentMedications", v)}
            isEdited={isEdited("currentMedications")}
            placeholder="None"
          />
        </Card>
        <Card title="Allergies" confidence={report.allergies.confidence}>
          <EditableList
            items={report.allergies.value}
            onSave={(v) => updateField("allergies", v)}
            isEdited={isEdited("allergies")}
            placeholder="None known"
          />
        </Card>
      </div>

      {/* Vital Signs */}
      {report.vitalSigns.value && report.vitalSigns.value !== "Not mentioned" && report.vitalSigns.value !== "Not recorded" && (
        <Card title="Vital Signs" confidence={report.vitalSigns.confidence}>
          <EditableField
            value={report.vitalSigns.value}
            onSave={(v) => updateField("vitalSigns", v)}
            isEdited={isEdited("vitalSigns")}
            className="text-slate-700"
          />
        </Card>
      )}

      {/* Assessment */}
      <Card title="Clinical Assessment" highlight confidence={report.assessment.confidence}>
        <EditableField
          value={report.assessment.value}
          onSave={(v) => updateField("assessment", v)}
          isEdited={isEdited("assessment")}
          multiline
          className="text-slate-700"
        />
      </Card>

      {/* Recommended Actions */}
      <Card title="Recommended Actions" confidence={report.recommendedActions.confidence}>
        <EditableList
          items={report.recommendedActions.value}
          onSave={(v) => updateField("recommendedActions", v)}
          isEdited={isEdited("recommendedActions")}
          ordered
          placeholder="No actions specified"
        />
      </Card>

      {/* Notes */}
      {(report.notes.value && report.notes.value !== "Not mentioned" && report.notes.value !== "") || hasEdits ? (
        <Card title="Additional Notes" confidence={report.notes.confidence}>
          <EditableField
            value={report.notes.value || ""}
            onSave={(v) => updateField("notes", v)}
            isEdited={isEdited("notes")}
            multiline
            className="text-slate-700"
            placeholder="Add notes..."
          />
        </Card>
      ) : null}

      {/* Bottom download button for mobile */}
      <div className="pt-4 pb-2">
        <DownloadButton report={report} />
        {hasEdits && (
          <p className="text-center text-xs text-slate-500 mt-2">
            PDF will include your edits
          </p>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  highlight = false,
  confidence,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
  confidence?: ConfidenceMetadata;
}) {
  return (
    <div
      className={`
        rounded-xl p-4 shadow-sm border
        ${highlight ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200"}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </h3>
        {confidence && <ConfidenceIndicator confidence={confidence} />}
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
      {children}
    </div>
  );
}

function ConfidentInfoItem({
  label,
  field,
  isEdited,
  onSave,
}: {
  label: string;
  field: ConfidentField<string>;
  isEdited: boolean;
  onSave: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500">{label}</span>
        <ConfidenceIndicator confidence={field.confidence} />
      </div>
      <EditableField
        value={field.value || ""}
        onSave={onSave}
        isEdited={isEdited}
        className="text-slate-700 font-medium"
        placeholder="—"
      />
    </div>
  );
}

function UrgencyBadge({ 
  level, 
  confidence 
}: { 
  level: 1 | 2 | 3 | 4 | 5;
  confidence: ConfidenceMetadata;
}) {
  const config = {
    1: { label: "Routine", className: "bg-green-100 text-green-700" },
    2: { label: "Low", className: "bg-blue-100 text-blue-700" },
    3: { label: "Moderate", className: "bg-yellow-100 text-yellow-700" },
    4: { label: "Urgent", className: "bg-orange-100 text-orange-700" },
    5: { label: "Emergency", className: "bg-red-100 text-red-700" },
  };

  const { label, className } = config[level];

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 ${className}`}
    >
      {label} ({level}/5)
      <ConfidenceIndicator confidence={confidence} />
    </span>
  );
}

function SeverityBadge({
  severity,
  confidence,
}: {
  severity: "mild" | "moderate" | "severe" | "critical";
  confidence: ConfidenceMetadata;
}) {
  const config = {
    mild: { className: "bg-green-100 text-green-700" },
    moderate: { className: "bg-yellow-100 text-yellow-700" },
    severe: { className: "bg-orange-100 text-orange-700" },
    critical: { className: "bg-red-100 text-red-700" },
  };

  const { className } = config[severity];

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium capitalize inline-flex items-center gap-1 ${className}`}
    >
      {severity}
      <ConfidenceIndicator confidence={confidence} />
    </span>
  );
}
