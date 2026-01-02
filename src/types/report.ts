/**
 * Confidence level for AI-extracted fields
 * - high (0.8-1.0): Explicitly stated in transcript
 * - medium (0.5-0.79): Implied or partially stated
 * - low (0.0-0.49): Inferred or unclear
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Metadata about AI extraction confidence
 */
export interface ConfidenceMetadata {
  /** Confidence score between 0.0 and 1.0 */
  score: number;
  /** Confidence level derived from score */
  level: ConfidenceLevel;
  /** Optional note explaining assumptions or ambiguity */
  note?: string;
}

/**
 * A field value with confidence metadata
 */
export interface ConfidentField<T> {
  value: T;
  confidence: ConfidenceMetadata;
}

/**
 * Helper to derive confidence level from score
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

/**
 * Helper to create a confident field
 */
export function createConfidentField<T>(
  value: T,
  score: number,
  note?: string
): ConfidentField<T> {
  return {
    value,
    confidence: {
      score,
      level: getConfidenceLevel(score),
      note,
    },
  };
}

export interface PatientInfo {
  name: ConfidentField<string>;
  species: ConfidentField<string>;
  breed: ConfidentField<string>;
  age: ConfidentField<string>;
  weight: ConfidentField<string>;
  sex: ConfidentField<string>;
}

export interface OwnerInfo {
  name: ConfidentField<string>;
  phone: ConfidentField<string>;
  email: ConfidentField<string>;
}

export interface IntakeReport {
  patient: PatientInfo;
  owner: OwnerInfo;
  chiefComplaint: ConfidentField<string>;
  symptoms: ConfidentField<string[]>;
  duration: ConfidentField<string>;
  severity: ConfidentField<"mild" | "moderate" | "severe" | "critical">;
  medicalHistory: ConfidentField<string>;
  currentMedications: ConfidentField<string[]>;
  allergies: ConfidentField<string[]>;
  vitalSigns: ConfidentField<string>;
  assessment: ConfidentField<string>;
  recommendedActions: ConfidentField<string[]>;
  urgencyLevel: ConfidentField<1 | 2 | 3 | 4 | 5>;
  notes: ConfidentField<string>;
}

/**
 * Legacy report format (for backward compatibility during migration)
 */
export interface LegacyIntakeReport {
  patient: {
    name: string;
    species: string;
    breed: string;
    age: string;
    weight: string;
    sex: string;
  };
  owner: {
    name: string;
    phone: string;
    email: string;
  };
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

/**
 * Convert legacy report to confident report (for session restore compatibility)
 */
export function migrateFromLegacy(legacy: LegacyIntakeReport): IntakeReport {
  const defaultConfidence = (_value: unknown): ConfidenceMetadata => ({
    score: 0.7,
    level: "medium",
    note: "Migrated from previous session",
  });

  return {
    patient: {
      name: { value: legacy.patient.name, confidence: defaultConfidence(legacy.patient.name) },
      species: { value: legacy.patient.species, confidence: defaultConfidence(legacy.patient.species) },
      breed: { value: legacy.patient.breed, confidence: defaultConfidence(legacy.patient.breed) },
      age: { value: legacy.patient.age, confidence: defaultConfidence(legacy.patient.age) },
      weight: { value: legacy.patient.weight, confidence: defaultConfidence(legacy.patient.weight) },
      sex: { value: legacy.patient.sex, confidence: defaultConfidence(legacy.patient.sex) },
    },
    owner: {
      name: { value: legacy.owner.name, confidence: defaultConfidence(legacy.owner.name) },
      phone: { value: legacy.owner.phone, confidence: defaultConfidence(legacy.owner.phone) },
      email: { value: legacy.owner.email, confidence: defaultConfidence(legacy.owner.email) },
    },
    chiefComplaint: { value: legacy.chiefComplaint, confidence: defaultConfidence(legacy.chiefComplaint) },
    symptoms: { value: legacy.symptoms, confidence: defaultConfidence(legacy.symptoms) },
    duration: { value: legacy.duration, confidence: defaultConfidence(legacy.duration) },
    severity: { value: legacy.severity, confidence: defaultConfidence(legacy.severity) },
    medicalHistory: { value: legacy.medicalHistory, confidence: defaultConfidence(legacy.medicalHistory) },
    currentMedications: { value: legacy.currentMedications, confidence: defaultConfidence(legacy.currentMedications) },
    allergies: { value: legacy.allergies, confidence: defaultConfidence(legacy.allergies) },
    vitalSigns: { value: legacy.vitalSigns, confidence: defaultConfidence(legacy.vitalSigns) },
    assessment: { value: legacy.assessment, confidence: defaultConfidence(legacy.assessment) },
    recommendedActions: { value: legacy.recommendedActions, confidence: defaultConfidence(legacy.recommendedActions) },
    urgencyLevel: { value: legacy.urgencyLevel, confidence: defaultConfidence(legacy.urgencyLevel) },
    notes: { value: legacy.notes, confidence: defaultConfidence(legacy.notes) },
  };
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
