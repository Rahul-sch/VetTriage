/**
 * Check if Web Speech API is supported in the current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Get the SpeechRecognition constructor (handles vendor prefixes)
 */
export function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;

  return window.SpeechRecognition || window.webkitSpeechRecognition;
}
