import { useEffect } from "react";
import type { IntakeReport } from "../types/report";
import { DownloadButton } from "./DownloadButton";
import { EditableField } from "./EditableField";
import { EditableList } from "./EditableList";
import { useEditableReport } from "../hooks/useEditableReport";

interface ReportPreviewProps {
  report: IntakeReport;
  /** Called when user edits the report (for persistence) */
  onReportEdit?: (editedReport: IntakeReport) => void;
}

export function ReportPreview({ report: initialReport, onReportEdit }: ReportPreviewProps) {
  const { report, isEdited, updateField, hasEdits, resetEdits } =
    useEditableReport(initialReport);

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
          <UrgencyBadge level={report.urgencyLevel} />
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

      {/* Edit instructions */}
      <p className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
        💡 Click any field to edit. Changes are reflected in the PDF.
      </p>

      {/* Patient Info Card */}
      <Card title="Patient Information">
        <InfoGrid>
          <EditableInfoItem
            label="Name"
            value={report.patient.name}
            isEdited={isEdited("patient.name")}
            onSave={(v) => updateField("patient.name", v)}
          />
          <EditableInfoItem
            label="Species"
            value={report.patient.species}
            isEdited={isEdited("patient.species")}
            onSave={(v) => updateField("patient.species", v)}
          />
          <EditableInfoItem
            label="Breed"
            value={report.patient.breed}
            isEdited={isEdited("patient.breed")}
            onSave={(v) => updateField("patient.breed", v)}
          />
          <EditableInfoItem
            label="Age"
            value={report.patient.age}
            isEdited={isEdited("patient.age")}
            onSave={(v) => updateField("patient.age", v)}
          />
          <EditableInfoItem
            label="Weight"
            value={report.patient.weight}
            isEdited={isEdited("patient.weight")}
            onSave={(v) => updateField("patient.weight", v)}
          />
          <EditableInfoItem
            label="Sex"
            value={report.patient.sex}
            isEdited={isEdited("patient.sex")}
            onSave={(v) => updateField("patient.sex", v)}
          />
        </InfoGrid>
      </Card>

      {/* Owner Info Card */}
      <Card title="Owner Information">
        <InfoGrid>
          <EditableInfoItem
            label="Name"
            value={report.owner.name}
            isEdited={isEdited("owner.name")}
            onSave={(v) => updateField("owner.name", v)}
          />
          <EditableInfoItem
            label="Phone"
            value={report.owner.phone}
            isEdited={isEdited("owner.phone")}
            onSave={(v) => updateField("owner.phone", v)}
          />
          <EditableInfoItem
            label="Email"
            value={report.owner.email}
            isEdited={isEdited("owner.email")}
            onSave={(v) => updateField("owner.email", v)}
          />
        </InfoGrid>
      </Card>

      {/* Chief Complaint */}
      <Card title="Chief Complaint">
        <EditableField
          value={report.chiefComplaint}
          onSave={(v) => updateField("chiefComplaint", v)}
          isEdited={isEdited("chiefComplaint")}
          multiline
          className="text-slate-700"
        />
        <div className="mt-2 flex items-center gap-2">
          <SeverityBadge severity={report.severity} />
          <span className="text-sm text-slate-500">
            Duration:{" "}
            <EditableField
              value={report.duration}
              onSave={(v) => updateField("duration", v)}
              isEdited={isEdited("duration")}
              className="inline text-sm"
            />
          </span>
        </div>
      </Card>

      {/* Symptoms */}
      <Card title="Symptoms">
        <EditableList
          items={report.symptoms}
          onSave={(v) => updateField("symptoms", v)}
          isEdited={isEdited("symptoms")}
          placeholder="No symptoms recorded"
        />
      </Card>

      {/* Medical History */}
      <Card title="Medical History">
        <EditableField
          value={report.medicalHistory}
          onSave={(v) => updateField("medicalHistory", v)}
          isEdited={isEdited("medicalHistory")}
          multiline
          className="text-slate-700"
        />
      </Card>

      {/* Medications & Allergies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Current Medications">
          <EditableList
            items={report.currentMedications}
            onSave={(v) => updateField("currentMedications", v)}
            isEdited={isEdited("currentMedications")}
            placeholder="None"
          />
        </Card>
        <Card title="Allergies">
          <EditableList
            items={report.allergies}
            onSave={(v) => updateField("allergies", v)}
            isEdited={isEdited("allergies")}
            placeholder="None known"
          />
        </Card>
      </div>

      {/* Vital Signs */}
      {report.vitalSigns && report.vitalSigns !== "Not mentioned" && (
        <Card title="Vital Signs">
          <EditableField
            value={report.vitalSigns}
            onSave={(v) => updateField("vitalSigns", v)}
            isEdited={isEdited("vitalSigns")}
            className="text-slate-700"
          />
        </Card>
      )}

      {/* Assessment */}
      <Card title="Clinical Assessment" highlight>
        <EditableField
          value={report.assessment}
          onSave={(v) => updateField("assessment", v)}
          isEdited={isEdited("assessment")}
          multiline
          className="text-slate-700"
        />
      </Card>

      {/* Recommended Actions */}
      <Card title="Recommended Actions">
        <EditableList
          items={report.recommendedActions}
          onSave={(v) => updateField("recommendedActions", v)}
          isEdited={isEdited("recommendedActions")}
          ordered
          placeholder="No actions specified"
        />
      </Card>

      {/* Notes */}
      {(report.notes && report.notes !== "Not mentioned") || hasEdits ? (
        <Card title="Additional Notes">
          <EditableField
            value={report.notes || ""}
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
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl p-4 shadow-sm border
        ${highlight ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200"}
      `}
    >
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
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

function EditableInfoItem({
  label,
  value,
  isEdited,
  onSave,
}: {
  label: string;
  value: string;
  isEdited: boolean;
  onSave: (value: string) => void;
}) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}</span>
      <EditableField
        value={value || ""}
        onSave={onSave}
        isEdited={isEdited}
        className="text-slate-700 font-medium"
        placeholder="—"
      />
    </div>
  );
}

function UrgencyBadge({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
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
      className={`px-3 py-1 rounded-full text-sm font-semibold ${className}`}
    >
      {label} ({level}/5)
    </span>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: "mild" | "moderate" | "severe" | "critical";
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
      className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${className}`}
    >
      {severity}
    </span>
  );
}
