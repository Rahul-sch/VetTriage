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
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load visit:", error);
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

  if (!visit) {
    return null; // Will redirect
  }

  const intakeData = visit.intakeData;
  const visitDate = new Date(visit.createdAt).toLocaleDateString();

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
              <h2 className="text-2xl font-bold text-slate-800">Visit Summary</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[visit.status]}`}>
                {STATUS_LABELS[visit.status]}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              Visit Token: <span className="font-mono text-slate-800">{visitToken}</span>
            </p>
            <p className="text-sm text-slate-600">
              Date: {visitDate}
            </p>
          </div>

          {intakeData ? (
            <>
              {/* Patient Info Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Patient Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Pet Name</p>
                    <p className="font-medium text-slate-800">{intakeData.petName}</p>
                  </div>
                </div>
              </div>

              {/* Symptoms Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Symptoms</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{intakeData.symptoms}</p>
                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-medium">Duration:</span> {intakeData.duration}
                </p>
              </div>

              {/* Concerns Card */}
              {intakeData.concerns && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Additional Concerns</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{intakeData.concerns}</p>
                </div>
              )}

              {/* Assessment Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Clinical Assessment</h3>
                <p className="text-slate-700">
                  {visit.status === "intake_complete" || visit.status === "pending_intake"
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
              This summary is for informational purposes. Please contact your veterinarian for any urgent concerns.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

