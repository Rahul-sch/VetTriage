/**
 * Simple global rate limiter for Groq API calls
 * Ensures minimum time between any API calls to avoid 429 errors
 */

let lastCallTime = 0;
const MIN_INTERVAL_MS = 2000; // 2 seconds between any Groq API calls

/**
 * Wait if needed to respect rate limits before making an API call
 * Returns immediately if enough time has passed since last call
 */
export async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;

  if (timeSinceLastCall < MIN_INTERVAL_MS) {
    const waitTime = MIN_INTERVAL_MS - timeSinceLastCall;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastCallTime = Date.now();
}
