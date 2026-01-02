import type { IntakeReport } from "../types/report";
import { DownloadButton } from "./DownloadButton";

interface ReportPreviewProps {
  report: IntakeReport;
}

export function ReportPreview({ report }: ReportPreviewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header with urgency and download */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Intake Report</h2>
          <UrgencyBadge level={report.urgencyLevel} />
        </div>
        <DownloadButton report={report} />
      </div>

      {/* Patient Info Card */}
      <Card title="Patient Information">
        <InfoGrid>
          <InfoItem label="Name" value={report.patient.name} />
          <InfoItem label="Species" value={report.patient.species} />
          <InfoItem label="Breed" value={report.patient.breed} />
          <InfoItem label="Age" value={report.patient.age} />
          <InfoItem label="Weight" value={report.patient.weight} />
          <InfoItem label="Sex" value={report.patient.sex} />
        </InfoGrid>
      </Card>

      {/* Owner Info Card */}
      <Card title="Owner Information">
        <InfoGrid>
          <InfoItem label="Name" value={report.owner.name} />
          <InfoItem label="Phone" value={report.owner.phone} />
          <InfoItem label="Email" value={report.owner.email} />
        </InfoGrid>
      </Card>

      {/* Chief Complaint */}
      <Card title="Chief Complaint">
        <p className="text-slate-700">{report.chiefComplaint}</p>
        <div className="mt-2 flex items-center gap-2">
          <SeverityBadge severity={report.severity} />
          <span className="text-sm text-slate-500">
            Duration: {report.duration}
          </span>
        </div>
      </Card>

      {/* Symptoms */}
      <Card title="Symptoms">
        {report.symptoms.length > 0 ? (
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            {report.symptoms.map((symptom, i) => (
              <li key={i}>{symptom}</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 italic">No symptoms recorded</p>
        )}
      </Card>

      {/* Medical History */}
      <Card title="Medical History">
        <p className="text-slate-700">{report.medicalHistory}</p>
      </Card>

      {/* Medications & Allergies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Current Medications">
          {report.currentMedications.length > 0 ? (
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {report.currentMedications.map((med, i) => (
                <li key={i}>{med}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">None</p>
          )}
        </Card>
        <Card title="Allergies">
          {report.allergies.length > 0 ? (
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {report.allergies.map((allergy, i) => (
                <li key={i}>{allergy}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">None known</p>
          )}
        </Card>
      </div>

      {/* Vital Signs */}
      {report.vitalSigns && report.vitalSigns !== "Not mentioned" && (
        <Card title="Vital Signs">
          <p className="text-slate-700">{report.vitalSigns}</p>
        </Card>
      )}

      {/* Assessment */}
      <Card title="Clinical Assessment" highlight>
        <p className="text-slate-700">{report.assessment}</p>
      </Card>

      {/* Recommended Actions */}
      <Card title="Recommended Actions">
        {report.recommendedActions.length > 0 ? (
          <ol className="list-decimal list-inside text-slate-700 space-y-1">
            {report.recommendedActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ol>
        ) : (
          <p className="text-slate-500 italic">No actions specified</p>
        )}
      </Card>

      {/* Notes */}
      {report.notes && report.notes !== "Not mentioned" && (
        <Card title="Additional Notes">
          <p className="text-slate-700">{report.notes}</p>
        </Card>
      )}

      {/* Bottom download button for mobile */}
      <div className="pt-4 pb-2">
        <DownloadButton report={report} />
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}</span>
      <p className="text-slate-700 font-medium">{value || "—"}</p>
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
