/**
 * Global rate limiter for Groq API calls
 * Ensures:
 * 1. Minimum time between any API calls
 * 2. Only ONE request in-flight at a time (single-flight lock)
 * 3. Cooldown period after 429 errors
 */

let lastCallTime = 0;
let isRequestInFlight = false;
let cooldownUntil = 0;
let flightResolvers: (() => void)[] = [];

const MIN_INTERVAL_MS = 2000; // 2 seconds between any Groq API calls
const DEFAULT_COOLDOWN_MS = 15000; // 15 second cooldown after 429

/**
 * Wait for any in-flight request to complete
 */
async function waitForInFlight(): Promise<void> {
  if (!isRequestInFlight) return;

  return new Promise((resolve) => {
    flightResolvers.push(resolve);
  });
}

/**
 * Wait if needed to respect rate limits before making an API call
 * Returns immediately if enough time has passed and no request is in-flight
 */
export async function waitForRateLimit(): Promise<void> {
  // Wait for any in-flight request to complete first
  await waitForInFlight();

  const now = Date.now();

  // Check cooldown (from 429 errors)
  if (now < cooldownUntil) {
    const cooldownWait = cooldownUntil - now;
    console.log(`Rate limiter: waiting ${cooldownWait}ms for cooldown`);
    await new Promise((resolve) => setTimeout(resolve, cooldownWait));
  }

  // Check minimum interval
  const timeSinceLastCall = Date.now() - lastCallTime;
  if (timeSinceLastCall < MIN_INTERVAL_MS) {
    const waitTime = MIN_INTERVAL_MS - timeSinceLastCall;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  // Mark request as in-flight
  isRequestInFlight = true;
}

/**
 * Mark the current request as complete
 * Must be called in finally block after fetch completes
 */
export function markRequestComplete(): void {
  lastCallTime = Date.now();
  isRequestInFlight = false;

  // Resolve all waiting requests
  const resolvers = flightResolvers;
  flightResolvers = [];
  resolvers.forEach((resolve) => resolve());
}

/**
 * Set a cooldown period (after 429 error)
 */
export function setCooldown(seconds: number = DEFAULT_COOLDOWN_MS / 1000): void {
  cooldownUntil = Date.now() + seconds * 1000;
  console.log(`Rate limiter: cooldown set for ${seconds}s`);
}

/**
 * Check if currently in cooldown period
 */
export function isInCooldown(): boolean {
  return Date.now() < cooldownUntil;
}

/**
 * Get remaining cooldown time in seconds
 */
export function getCooldownRemaining(): number {
  const remaining = cooldownUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
