import type { IntakeReport, AnalysisResponse } from "../types/report";
import {
  VETERINARY_INTAKE_SYSTEM_PROMPT,
  createUserPrompt,
} from "../prompts/veterinary-intake";

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
  const envKey = import.meta.env.VITE_GROQ_API_KEY;
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
 * Parse JSON safely, handling common LLM output issues
 */
function parseJsonSafely(text: string): IntakeReport | null {
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
    return JSON.parse(cleaned) as IntakeReport;
  } catch {
    console.error("Failed to parse JSON:", cleaned);
    return null;
  }
}

/**
 * Validate that the parsed object has the expected structure
 */
function validateReport(obj: unknown): obj is IntakeReport {
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

  // Validate urgency level is 1-5
  const urgency = report.urgencyLevel;
  if (
    typeof urgency !== "number" ||
    urgency < 1 ||
    urgency > 5 ||
    !Number.isInteger(urgency)
  ) {
    console.warn("Invalid urgency level:", urgency);
    // Fix it instead of failing
    (report as IntakeReport).urgencyLevel = 3;
  }

  // Validate severity
  const validSeverities = ["mild", "moderate", "severe", "critical"];
  if (!validSeverities.includes(report.severity as string)) {
    console.warn("Invalid severity:", report.severity);
    (report as IntakeReport).severity = "moderate";
  }

  return true;
}

/**
 * Analyze a transcript using Groq AI
 */
export async function analyzeTranscript(
  transcript: string
): Promise<AnalysisResponse> {
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
        max_tokens: 2000,
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

    return {
      success: true,
      report: parsed,
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

