import type { Visit, VisitStatus, IntakeData } from "../types/visit";

const VISITS_STORAGE_KEY = "vettriage_visits";
const VISIT_TOKEN_LENGTH = 12;

/**
 * Generate a unique visit token
 */
function generateVisitToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < VISIT_TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Get all visits from localStorage
 */
function getAllVisits(): Visit[] {
  try {
    const stored = localStorage.getItem(VISITS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Visit[];
  } catch (error) {
    console.error("Failed to load visits:", error);
    return [];
  }
}

/**
 * Save all visits to localStorage
 */
function saveAllVisits(visits: Visit[]): void {
  try {
    localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(visits));
  } catch (error) {
    console.error("Failed to save visits:", error);
  }
}

/**
 * Create a new visit with a unique token
 */
export function createVisit(): Visit {
  const visits = getAllVisits();
  
  // Generate unique token (check for collisions)
  let visitToken: string;
  let attempts = 0;
  do {
    visitToken = generateVisitToken();
    attempts++;
    if (attempts > 100) {
      // Fallback: add timestamp to ensure uniqueness
      visitToken = generateVisitToken() + Date.now().toString(36).slice(-4);
      break;
    }
  } while (visits.some((v) => v.visitToken === visitToken));

  const now = new Date().toISOString();
  const visit: Visit = {
    id: `visit_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    visitToken,
    status: "pending_intake",
    intakeData: null,
    createdAt: now,
    updatedAt: now,
  };

  visits.push(visit);
  saveAllVisits(visits);

  return visit;
}

/**
 * Get a visit by visitToken
 */
export function getVisitByToken(visitToken: string): Visit | null {
  const visits = getAllVisits();
  return visits.find((v) => v.visitToken === visitToken) || null;
}

/**
 * Update a visit
 */
export function updateVisit(visitToken: string, updates: Partial<Visit>): Visit | null {
  const visits = getAllVisits();
  const index = visits.findIndex((v) => v.visitToken === visitToken);
  
  if (index === -1) {
    console.warn(`Visit not found: ${visitToken}`);
    return null;
  }

  const updated: Visit = {
    ...visits[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  visits[index] = updated;
  saveAllVisits(visits);

  return updated;
}

/**
 * Update visit status
 */
export function updateVisitStatus(
  visitToken: string,
  status: VisitStatus
): Visit | null {
  return updateVisit(visitToken, { status });
}

/**
 * Submit intake data for a visit
 */
export function submitIntakeData(
  visitToken: string,
  intakeData: Omit<IntakeData, "submittedAt">
): Visit | null {
  const fullIntakeData: IntakeData = {
    ...intakeData,
    submittedAt: new Date().toISOString(),
  };

  return updateVisit(visitToken, {
    intakeData: fullIntakeData,
    status: "intake_complete",
  });
}

/**
 * Get all visits (for debugging/admin)
 */
export function getAllVisitsList(): Visit[] {
  return getAllVisits();
}

/**
 * Clear all visits (for testing)
 */
export function clearAllVisits(): void {
  localStorage.removeItem(VISITS_STORAGE_KEY);
}

