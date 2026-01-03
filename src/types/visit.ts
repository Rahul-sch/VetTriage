/**
 * Visit status enum
 */
export type VisitStatus =
  | "pending_intake"
  | "intake_complete"
  | "in_progress"
  | "complete"
  | "shared";

/**
 * Intake form data submitted by owner
 */
export interface IntakeData {
  petName: string;
  symptoms: string;
  duration: string;
  concerns: string;
  submittedAt: string; // ISO timestamp
}

/**
 * Visit record
 */
export interface Visit {
  id: string; // Unique visit ID
  visitToken: string; // Token used in URL
  status: VisitStatus;
  intakeData: IntakeData | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

