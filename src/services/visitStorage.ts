import type { Visit, VisitStatus, IntakeData } from "../types/visit";
import { supabase } from "../lib/supabase";

const VISIT_TOKEN_LENGTH = 12;

/**
 * Database row structure (snake_case)
 */
interface VisitRow {
  id: string;
  visit_token: string;
  status: string;
  intake_data: IntakeData | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to Visit type
 */
function rowToVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    visitToken: row.visit_token,
    status: row.status as VisitStatus,
    intakeData: row.intake_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
 * Create a new visit with a unique token
 */
export async function createVisit(sessionId?: string): Promise<Visit> {
  // Generate unique token (Supabase unique constraint will handle collisions)
  let visitToken: string;
  let attempts = 0;
  let isUnique = false;

  while (!isUnique && attempts < 10) {
    visitToken = generateVisitToken();
    
    // Check if token exists
    const { data: existing } = await supabase
      .from("visits")
      .select("visit_token")
      .eq("visit_token", visitToken)
      .single();

    if (!existing) {
      isUnique = true;
    } else {
      attempts++;
    }
  }

  // Fallback: add timestamp if still not unique after 10 attempts
  if (!isUnique) {
    visitToken = generateVisitToken() + Date.now().toString(36).slice(-4);
  }

  const { data, error } = await supabase
    .from("visits")
    .insert({
      visit_token: visitToken!,
      status: "pending_intake",
      intake_data: null,
      session_id: sessionId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create visit:", error);
    throw new Error(`Failed to create visit: ${error.message}`);
  }

  return rowToVisit(data as VisitRow);
}

/**
 * Get a visit by visitToken
 */
export async function getVisitByToken(visitToken: string): Promise<Visit | null> {
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("visit_token", visitToken)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Failed to get visit:", error);
    return null;
  }

  return rowToVisit(data as VisitRow);
}

/**
 * Update a visit
 */
export async function updateVisit(
  visitToken: string,
  updates: Partial<Omit<Visit, "id" | "createdAt" | "updatedAt">>
): Promise<Visit | null> {
  const updateData: Partial<VisitRow> = {};

  if (updates.visitToken !== undefined) {
    updateData.visit_token = updates.visitToken;
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }
  if (updates.intakeData !== undefined) {
    updateData.intake_data = updates.intakeData;
  }

  const { data, error } = await supabase
    .from("visits")
    .update(updateData)
    .eq("visit_token", visitToken)
    .select()
    .single();

  if (error) {
    console.error("Failed to update visit:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return rowToVisit(data as VisitRow);
}

/**
 * Update visit status
 */
export async function updateVisitStatus(
  visitToken: string,
  status: VisitStatus
): Promise<Visit | null> {
  return updateVisit(visitToken, { status });
}

/**
 * Submit intake data for a visit
 */
export async function submitIntakeData(
  visitToken: string,
  intakeData: Omit<IntakeData, "submittedAt">
): Promise<Visit | null> {
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
export async function getAllVisitsList(): Promise<Visit[]> {
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to get visits:", error);
    return [];
  }

  return (data || []).map(rowToVisit);
}

/**
 * Clear all visits (for testing)
 */
export async function clearAllVisits(): Promise<void> {
  const { error } = await supabase.from("visits").delete().neq("id", "");

  if (error) {
    console.error("Failed to clear visits:", error);
  }
}
