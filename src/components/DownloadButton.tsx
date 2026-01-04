import type { IntakeReport } from "../types/report";
import { generateIntakeReportPDF } from "../services/pdfGenerator";

interface DownloadButtonProps {
  report: IntakeReport;
}

export function DownloadButton({ report }: DownloadButtonProps) {
  const handleDownload = () => {
    generateIntakeReportPDF(report);
  };

  return (
    <button
      onClick={handleDownload}
      className="
        flex items-center justify-center gap-2
        bg-teal-600 hover:bg-teal-500
        text-white font-semibold
        px-6 py-3 rounded-xl
        shadow-lg hover:shadow-xl dark:shadow-teal-900/30
        transition-all duration-200
        active:scale-95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
        w-full sm:w-auto
      "
    >
      <DownloadIcon />
      Download PDF
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}
