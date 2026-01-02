/**
 * Check if Web Speech API is supported in the current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  return !!(
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition: unknown })
      .webkitSpeechRecognition
  );
}

/**
 * Get the SpeechRecognition constructor (handles vendor prefixes)
 */
export function getSpeechRecognition():
  | typeof SpeechRecognition
  | undefined {
  if (typeof window === "undefined") return undefined;

  return (
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition })
      .webkitSpeechRecognition
  );
}

