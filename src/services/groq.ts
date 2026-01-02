import type { IntakeReport, AnalysisResponse, ConfidentField, ConfidenceLevel } from "../types/report";
import { getConfidenceLevel } from "../types/report";
import {
  VETERINARY_INTAKE_SYSTEM_PROMPT,
  createUserPrompt,
} from "../prompts/veterinary-intake";
import { waitForRateLimit } from "./rateLimiter";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqChoice {
  message: {
    content: string;
  };
}

interface GroqResponse {
  choices: GroqChoice[];
}

/**
 * Get the Groq API key from environment or localStorage
 */
export function getApiKey(): string | null {
  // First check environment variable (for development)
  const envKey = import.meta.env?.VITE_GROQ_API_KEY as string | undefined;
  if (envKey && envKey !== "your_key_here") {
    return envKey;
  }

  // Fall back to localStorage (for user-provided keys)
  return localStorage.getItem("groq_api_key");
}

/**
 * Set the Groq API key in localStorage
 */
export function setApiKey(key: string): void {
  localStorage.setItem("groq_api_key", key);
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return !!getApiKey();
}

/**
 * Raw confidence structure from AI
 */
interface RawConfidence {
  score: number;
  note?: string | null;
}

/**
 * Raw confident field from AI
 */
interface RawConfidentField<T> {
  value: T;
  confidence: RawConfidence;
}

/**
 * Normalize a confident field, adding the derived level
 */
function normalizeConfidentField<T>(
  raw: RawConfidentField<T> | T | undefined,
  defaultValue: T
): ConfidentField<T> {
  // Handle case where AI returns value directly without confidence wrapper
  if (raw === undefined || raw === null) {
    return {
      value: defaultValue,
      confidence: {
        score: 0,
        level: "low" as ConfidenceLevel,
        note: "Not provided in transcript",
      },
    };
  }

  // Check if it's a confident field structure
  if (typeof raw === "object" && raw !== null && "value" in raw && "confidence" in raw) {
    const field = raw as RawConfidentField<T>;
    const score = Math.max(0, Math.min(1, field.confidence.score || 0));
    return {
      value: field.value ?? defaultValue,
      confidence: {
        score,
        level: getConfidenceLevel(score),
        note: field.confidence.note ?? undefined,
      },
    };
  }

  // Fallback: AI returned plain value without confidence wrapper
  return {
    value: raw as T,
    confidence: {
      score: 0.7,
      level: "medium" as ConfidenceLevel,
      note: "Confidence not provided by AI",
    },
  };
}

/**
 * Parse JSON safely, handling common LLM output issues
 */
function parseJsonSafely(text: string): Record<string, unknown> | null {
  // Remove any markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    console.error("Failed to parse JSON:", cleaned);
    return null;
  }
}

/**
 * Transform raw AI response into normalized IntakeReport
 */
function transformToReport(raw: Record<string, unknown>): IntakeReport {
  const patient = (raw.patient || {}) as Record<string, unknown>;
  const owner = (raw.owner || {}) as Record<string, unknown>;

  return {
    patient: {
      name: normalizeConfidentField(patient.name as RawConfidentField<string>, "Not mentioned"),
      species: normalizeConfidentField(patient.species as RawConfidentField<string>, "Not mentioned"),
      breed: normalizeConfidentField(patient.breed as RawConfidentField<string>, "Not mentioned"),
      age: normalizeConfidentField(patient.age as RawConfidentField<string>, "Not mentioned"),
      weight: normalizeConfidentField(patient.weight as RawConfidentField<string>, "Not mentioned"),
      sex: normalizeConfidentField(patient.sex as RawConfidentField<string>, "Not mentioned"),
    },
    owner: {
      name: normalizeConfidentField(owner.name as RawConfidentField<string>, "Not mentioned"),
      phone: normalizeConfidentField(owner.phone as RawConfidentField<string>, "Not mentioned"),
      email: normalizeConfidentField(owner.email as RawConfidentField<string>, "Not mentioned"),
    },
    chiefComplaint: normalizeConfidentField(
      raw.chiefComplaint as RawConfidentField<string>,
      "Not mentioned"
    ),
    symptoms: normalizeConfidentField(
      raw.symptoms as RawConfidentField<string[]>,
      []
    ),
    duration: normalizeConfidentField(
      raw.duration as RawConfidentField<string>,
      "Not mentioned"
    ),
    severity: normalizeConfidentField(
      raw.severity as RawConfidentField<"mild" | "moderate" | "severe" | "critical">,
      "moderate"
    ),
    medicalHistory: normalizeConfidentField(
      raw.medicalHistory as RawConfidentField<string>,
      "Not mentioned"
    ),
    currentMedications: normalizeConfidentField(
      raw.currentMedications as RawConfidentField<string[]>,
      []
    ),
    allergies: normalizeConfidentField(
      raw.allergies as RawConfidentField<string[]>,
      []
    ),
    vitalSigns: normalizeConfidentField(
      raw.vitalSigns as RawConfidentField<string>,
      "Not recorded"
    ),
    assessment: normalizeConfidentField(
      raw.assessment as RawConfidentField<string>,
      "Pending examination"
    ),
    recommendedActions: normalizeConfidentField(
      raw.recommendedActions as RawConfidentField<string[]>,
      []
    ),
    urgencyLevel: normalizeConfidentField(
      raw.urgencyLevel as RawConfidentField<1 | 2 | 3 | 4 | 5>,
      3
    ),
    notes: normalizeConfidentField(
      raw.notes as RawConfidentField<string>,
      ""
    ),
  };
}

/**
 * Validate that the parsed object has the expected structure
 */
function validateReport(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;

  const report = obj as Record<string, unknown>;

  // Check required top-level fields exist
  const requiredFields = [
    "patient",
    "owner",
    "chiefComplaint",
    "symptoms",
    "severity",
    "assessment",
    "urgencyLevel",
  ];

  for (const field of requiredFields) {
    if (!(field in report)) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Analyze a transcript using Groq AI
 */
export async function analyzeTranscript(
  transcript: string
): Promise<AnalysisResponse> {
  // Check online status first
  if (!navigator.onLine) {
    return {
      success: false,
      error: "You're offline. AI analysis requires an internet connection.",
    };
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: "No API key configured. Please add your Groq API key.",
    };
  }

  if (!transcript.trim()) {
    return {
      success: false,
      error: "No transcript to analyze.",
    };
  }

  const messages: GroqMessage[] = [
    { role: "system", content: VETERINARY_INTAKE_SYSTEM_PROMPT },
    { role: "user", content: createUserPrompt(transcript) },
  ];

  // Wait for global rate limit before making the call
  await waitForRateLimit();

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1, // Low temperature for consistent structured output
        max_tokens: 3000, // Increased for confidence metadata
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: "Invalid API key. Please check your Groq API key.",
        };
      }
      if (response.status === 429) {
        return {
          success: false,
          error: "Rate limit exceeded. Please wait a moment and try again.",
        };
      }
      return {
        success: false,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as GroqResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: "No response from AI.",
      };
    }

    const parsed = parseJsonSafely(content);

    if (!parsed) {
      return {
        success: false,
        error: "Failed to parse AI response as JSON.",
      };
    }

    if (!validateReport(parsed)) {
      return {
        success: false,
        error: "AI response missing required fields.",
      };
    }

    // Transform to normalized report with confidence levels
    const report = transformToReport(parsed);

    return {
      success: true,
      report,
    };
  } catch (error) {
    console.error("Groq API error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error occurred.",
    };
  }
}
