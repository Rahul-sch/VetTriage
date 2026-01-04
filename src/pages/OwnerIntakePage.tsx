import { useState, FormEvent, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVisitByToken, submitIntakeData } from "../services/visitStorage";
import { ThemeToggle } from "../components/ThemeToggle";
import type { Visit } from "../types/visit";

interface IntakeFormData {
  petName: string;
  symptoms: string;
  duration: string;
  concerns: string;
}

export function OwnerIntakePage() {
  const { visitToken } = useParams<{ visitToken: string }>();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<IntakeFormData>({
    petName: "",
    symptoms: "",
    duration: "",
    concerns: "",
  });

  // Load visit on mount
  useEffect(() => {
    async function loadVisit() {
      if (!visitToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentVisit = await getVisitByToken(visitToken);

        if (!currentVisit) {
          // Visit not found - in production, visits would be created server-side
          // For now, we'll show an error state
          setIsLoading(false);
          return;
        }

        setVisit(currentVisit);

        // If visit already has intake data, redirect to summary
        if (currentVisit.intakeData) {
          navigate(`/owner/${visitToken}/summary`, { replace: true });
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load visit:", error);
        setIsLoading(false);
      }
    }

    loadVisit();
  }, [visitToken, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!visitToken || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Submit intake data and update visit status
      const updatedVisit = await submitIntakeData(visitToken, {
        petName: formData.petName.trim(),
        symptoms: formData.symptoms.trim(),
        duration: formData.duration.trim(),
        concerns: formData.concerns.trim(),
      });

      if (updatedVisit) {
        setVisit(updatedVisit);
        setIsSubmitted(true);
      } else {
        setSubmitError("Failed to submit intake. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Failed to submit intake:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to submit intake. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof IntakeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
        <header className="bg-teal-700 dark:bg-slate-800 text-white px-4 py-3.5 shadow-md dark:shadow-slate-900/50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading visit...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
        <header className="bg-teal-700 dark:bg-slate-800 text-white px-4 py-3.5 shadow-md dark:shadow-slate-900/50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-slate-900/50 p-6 text-center border border-slate-200 dark:border-slate-700">
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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Visit Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              The visit token{" "}
              <span className="font-mono text-slate-800 dark:text-slate-200">{visitToken}</span>{" "}
              could not be found.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please check your link or contact the veterinary clinic.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
        <header className="bg-teal-700 dark:bg-slate-800 text-white px-4 py-3.5 shadow-md dark:shadow-slate-900/50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-slate-900/50 p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-emerald-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Thank You!
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Your intake information has been submitted successfully. The
              veterinary team will review it shortly.
            </p>
            <button
              onClick={() => navigate(`/owner/${visitToken}/summary`)}
              className="w-full px-4 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-500 transition-all shadow-sm hover:shadow-md"
            >
              View Summary
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors">
      <header className="bg-teal-700 dark:bg-slate-800 text-white px-4 py-3.5 shadow-md dark:shadow-slate-900/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-slate-900/50 p-6 mb-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Pet Intake Form
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Please provide information about your pet's condition
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-slate-900/50 p-6 space-y-6 border border-slate-200 dark:border-slate-700"
          >
            {/* Pet Name */}
            <div>
              <label
                htmlFor="petName"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Pet Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="petName"
                required
                value={formData.petName}
                onChange={(e) => handleChange("petName", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Enter your pet's name"
              />
            </div>

            {/* Symptoms */}
            <div>
              <label
                htmlFor="symptoms"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Symptoms <span className="text-red-500">*</span>
              </label>
              <textarea
                id="symptoms"
                required
                rows={4}
                value={formData.symptoms}
                onChange={(e) => handleChange("symptoms", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Describe the symptoms your pet is experiencing..."
              />
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="duration"
                required
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="e.g., 2 days, 1 week, since yesterday"
              />
            </div>

            {/* Concerns */}
            <div>
              <label
                htmlFor="concerns"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Additional Concerns
              </label>
              <textarea
                id="concerns"
                rows={3}
                value={formData.concerns}
                onChange={(e) => handleChange("concerns", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Any other information you'd like to share..."
              />
            </div>

            {/* Error message */}
            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-4 py-3 font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                isSubmitting
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
                  : "bg-teal-600 text-white hover:bg-teal-500 shadow-sm hover:shadow-md"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Intake Form"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
