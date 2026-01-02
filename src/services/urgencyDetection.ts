import type { UrgencyAssessment, UrgencyScore } from "../types/urgency";
import {
  URGENCY_DETECTION_SYSTEM_PROMPT,
  createUrgencyPrompt,
} from "../prompts/urgency-detection";
import { getApiKey } from "./groq";

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
 * Parse urgency assessment from AI response
 */
function parseUrgencyResponse(text: string): UrgencyAssessment | null {
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
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
    const parsed = JSON.parse(cleaned) as {
      urgency?: number;
      level?: string;
      reason?: string;
      alert?: string;
    };

    // Validate and normalize
    const urgency = Math.max(1, Math.min(5, parsed.urgency || 3)) as UrgencyScore;
    const level = parsed.level || (urgency <= 2 ? "routine" : urgency === 3 ? "monitor" : urgency === 4 ? "urgent" : "emergency");

    return {
      urgency,
      level: level as UrgencyAssessment["level"],
      reason: parsed.reason || "Assessment in progress",
      alert: parsed.alert,
    };
  } catch (error) {
    console.error("Failed to parse urgency response:", error);
    return null;
  }
}

/**
 * Detect urgency from partial transcript
 * Lightweight API call focused only on urgency assessment
 */
export async function detectUrgency(
  transcript: string
): Promise<UrgencyAssessment | null> {
  // Check online status
  if (!navigator.onLine) {
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  if (!transcript.trim()) {
    return null;
  }

  const messages: GroqMessage[] = [
    { role: "system", content: URGENCY_DETECTION_SYSTEM_PROMPT },
    { role: "user", content: createUrgencyPrompt(transcript) },
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
        temperature: 0.1, // Low temperature for consistent output
        max_tokens: 200, // Lightweight - only need urgency assessment
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Rate limit exceeded for urgency detection - skipping");
        return null;
      }
      console.warn("Urgency detection API error:", response.status);
      return null;
    }

    const data = (await response.json()) as GroqResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return null;
    }

    return parseUrgencyResponse(content);
  } catch (error) {
    console.error("Urgency detection error:", error);
    return null;
  }
}

