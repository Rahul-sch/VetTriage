import { useState, FormEvent, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVisitByToken, submitIntakeData } from "../services/visitStorage";
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
  const [formData, setFormData] = useState<IntakeFormData>({
    petName: "",
    symptoms: "",
    duration: "",
    concerns: "",
  });

  // Load visit on mount
  useEffect(() => {
    if (!visitToken) {
      setIsLoading(false);
      return;
    }

    const currentVisit = getVisitByToken(visitToken);
    
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
  }, [visitToken, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!visitToken) return;

    // Submit intake data and update visit status
    const updatedVisit = submitIntakeData(visitToken, {
      petName: formData.petName,
      symptoms: formData.symptoms,
      duration: formData.duration,
      concerns: formData.concerns,
    });

    if (updatedVisit) {
      setVisit(updatedVisit);
      setIsSubmitted(true);
    }
  };

  const handleChange = (
    field: keyof IntakeFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
            <p className="text-slate-600">Loading visit...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!visit) {
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
              Visit Not Found
            </h2>
            <p className="text-slate-600 mb-4">
              The visit token <span className="font-mono text-slate-800">{visitToken}</span> could not be found.
            </p>
            <p className="text-sm text-slate-500">
              Please check your link or contact the veterinary clinic.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isSubmitted) {
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
                className="w-16 h-16 text-green-500 mx-auto"
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
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Thank You!
            </h2>
            <p className="text-slate-600 mb-6">
              Your intake information has been submitted successfully. The veterinary team will review it shortly.
            </p>
            <button
              onClick={() => navigate(`/owner/${visitToken}/summary`)}
              className="w-full px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              View Summary
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-teal-700 text-white px-4 py-3 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight">VetTriage</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Pet Intake Form
            </h2>
            <p className="text-slate-600 text-sm">
              Please provide information about your pet's condition
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* Pet Name */}
            <div>
              <label
                htmlFor="petName"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Pet Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="petName"
                required
                value={formData.petName}
                onChange={(e) => handleChange("petName", e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter your pet's name"
              />
            </div>

            {/* Symptoms */}
            <div>
              <label
                htmlFor="symptoms"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Symptoms <span className="text-red-500">*</span>
              </label>
              <textarea
                id="symptoms"
                required
                rows={4}
                value={formData.symptoms}
                onChange={(e) => handleChange("symptoms", e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder="Describe the symptoms your pet is experiencing..."
              />
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="duration"
                required
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g., 2 days, 1 week, since yesterday"
              />
            </div>

            {/* Concerns */}
            <div>
              <label
                htmlFor="concerns"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Additional Concerns
              </label>
              <textarea
                id="concerns"
                rows={3}
                value={formData.concerns}
                onChange={(e) => handleChange("concerns", e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder="Any other information you'd like to share..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Submit Intake Form
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

