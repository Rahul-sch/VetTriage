export interface PatientInfo {
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  sex: string;
}

export interface OwnerInfo {
  name: string;
  phone: string;
  email: string;
}

export interface IntakeReport {
  patient: PatientInfo;
  owner: OwnerInfo;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: "mild" | "moderate" | "severe" | "critical";
  medicalHistory: string;
  currentMedications: string[];
  allergies: string[];
  vitalSigns: string;
  assessment: string;
  recommendedActions: string[];
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface AnalysisResult {
  success: true;
  report: IntakeReport;
}

export interface AnalysisError {
  success: false;
  error: string;
}

export type AnalysisResponse = AnalysisResult | AnalysisError;

