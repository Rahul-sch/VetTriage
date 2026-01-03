import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVisitByToken } from "../services/visitStorage";
import type { Visit } from "../types/visit";

const STATUS_LABELS: Record<Visit["status"], string> = {
  pending_intake: "Pending Intake",
  intake_complete: "Intake Complete",
  in_progress: "In Progress",
  complete: "Complete",
  shared: "Shared",
};

const STATUS_COLORS: Record<Visit["status"], string> = {
  pending_intake: "bg-slate-100 text-slate-700",
  intake_complete: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
  shared: "bg-purple-100 text-purple-700",
};

export function OwnerSummaryPage() {
  const { visitToken } = useParams<{ visitToken: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVisit() {
      if (!visitToken) {
        setIsLoading(false);
        return;
      }

      try {
        const foundVisit = await getVisitByToken(visitToken);

        if (!foundVisit) {
          // Visit not found, redirect to intake
          navigate(`/owner/${visitToken}`, { replace: true });
          return;
        }

        setVisit(foundVisit);
        setLoadError(null);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load visit:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load visit. Please try again."
        );
        setIsLoading(false);
      }
    }

    loadVisit();
  }, [visitToken, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-teal-700 text-white px-4 py-3 shadow-md">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading visit summary...</p>
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-teal-700 text-white px-4 py-3 shadow-md">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-red-400 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Error Loading Visit
            </h2>
            <p className="text-slate-600 mb-4">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!visit) {
    return null; // Will redirect
  }

  const intakeData = visit?.intakeData || null;
  const visitDate = visit?.createdAt
    ? new Date(visit.createdAt).toLocaleDateString()
    : "Unknown";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-teal-700 text-white px-4 py-3 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">
                Visit Summary
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  STATUS_COLORS[visit.status]
                }`}
              >
                {STATUS_LABELS[visit.status]}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Visit Token:{" "}
              <span className="font-mono text-slate-800">{visitToken}</span>
            </p>
            <p className="text-sm text-slate-600">Date: {visitDate}</p>
          </div>

          {intakeData ? (
            <>
              {/* Patient Info Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Pet Name</p>
                    <p className="font-medium text-slate-800">
                      {intakeData.petName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Symptoms Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Symptoms
                </h3>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {intakeData.symptoms}
                </p>
                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-medium">Duration:</span>{" "}
                  {intakeData.duration}
                </p>
              </div>

              {/* Concerns Card */}
              {intakeData.concerns && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Additional Concerns
                  </h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {intakeData.concerns}
                  </p>
                </div>
              )}

              {/* Assessment Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Clinical Assessment
                </h3>
                <p className="text-slate-700">
                  {visit.status === "shared"
                    ? "The veterinary assessment will be available here once the visit is complete."
                    : visit.status === "intake_complete" ||
                      visit.status === "pending_intake"
                    ? "Pending veterinary review"
                    : "Assessment will be available after veterinary review"}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-slate-600 text-center">
                Intake information not yet submitted.{" "}
                <button
                  onClick={() => navigate(`/owner/${visitToken}`)}
                  className="text-teal-600 hover:text-teal-700 underline"
                >
                  Complete intake form
                </button>
              </p>
            </div>
          )}

          {/* Footer Note */}
          <div className="bg-slate-100 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-600">
              This summary is for informational purposes. Please contact your
              veterinarian for any urgent concerns.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
