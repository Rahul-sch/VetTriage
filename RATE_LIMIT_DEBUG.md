# Rate Limit Issue - Detailed Debug Report

## Problem Statement

The application is experiencing **"Rate limit exceeded. Please wait a moment and try again."** errors when analyzing transcripts. This happens after recording completes and the main analysis runs.

## Root Cause Analysis

### Issue #1: Multiple Intervals Being Created (CRITICAL)

**Location:** `src/hooks/useUrgencyPulse.ts`, lines 98-111

**Problem:**
The `useEffect` hook that sets up the urgency pulse interval has `segments` in its dependency array:

```typescript
useEffect(() => {
  // ... sets up interval
}, [isRecording, segments, formatTranscript, analyzeUrgency]);
```

**Why this is broken:**

- Every time a new transcript segment is added, `segments` changes
- This causes the `useEffect` to re-run
- The cleanup function runs and clears the old interval
- BUT a NEW interval is immediately created
- However, if segments update rapidly, multiple intervals can exist simultaneously
- Each interval fires every 6 seconds, causing overlapping API calls

**Evidence:**

- During a 60-second recording, segments update ~10-20 times
- Each update potentially creates a new interval
- Even with cleanup, rapid updates can cause race conditions

**Fix Required:**

- Remove `segments` from the dependency array
- Use a ref to access current segments inside the interval callback
- OR: Only set up interval once when `isRecording` becomes true, don't recreate on segment changes

### Issue #2: Immediate Call + Interval Overlap

**Location:** `src/hooks/useUrgencyPulse.ts`, lines 88-103

**Problem:**
When recording starts, the code:

1. Makes an immediate urgency call (line 92)
2. Sets up an interval that will call again in 6 seconds (line 98)

**Why this is broken:**

- The immediate call sets `lastAnalysisTimeRef.current = Date.now()` (line 93)
- But the interval callback doesn't check if enough time has passed
- The interval fires 6 seconds later, but the cooldown check (5 seconds) might pass
- However, if the immediate call takes >1 second, the interval could fire while the first call is still in progress

**Evidence:**

- The cooldown is 5 seconds, interval is 6 seconds
- If immediate call takes 2 seconds, interval fires at 6 seconds (only 4 seconds after first call completes)
- This violates the 5-second cooldown

**Fix Required:**

- Don't make immediate call on recording start
- Let the interval handle all calls
- OR: Increase interval to 7+ seconds to account for API call duration

### Issue #3: Urgency Pulse Continues After Recording Stops

**Location:** `src/hooks/useUrgencyPulse.ts`, lines 99-110 and `src/pages/HomePage.tsx`, lines 171-197

**Problem:**
When recording stops:

1. The urgency pulse interval cleanup runs (line 106)
2. BUT if an urgency API call is already in-flight, it continues
3. The main analysis starts immediately (HomePage.tsx line 179)
4. Both API calls can hit Groq simultaneously

**Why this is broken:**

- The interval is cleared, but `isAnalyzingRef.current` might still be true
- An async `detectUrgency()` call might still be running
- Main analysis starts immediately when state becomes "processing"
- Two API calls hit Groq at the same time = rate limit

**Evidence:**

- State transitions: `recording` → `processing` happens immediately
- Urgency cleanup is async (doesn't cancel in-flight requests)
- Main analysis doesn't wait for urgency calls to complete

**Fix Required:**

- Cancel in-flight urgency calls when recording stops
- Add a delay before main analysis starts (wait 1-2 seconds)
- OR: Use an AbortController to cancel fetch requests

### Issue #4: No Global Rate Limiting

**Location:** All API call locations

**Problem:**
There's no global rate limiter tracking ALL Groq API calls (urgency + main analysis).

**Why this is broken:**

- Urgency pulse has its own cooldown (5 seconds)
- Main analysis has no cooldown
- If urgency calls at T=0, T=6, T=12, T=18...
- Main analysis can call at T=20 (right after urgency at T=18)
- Groq might have a 30 requests/minute limit
- Multiple rapid calls = rate limit

**Evidence:**

- Groq free tier typically has 30 requests/minute
- During a 60-second recording: ~10 urgency calls
- Plus 1 main analysis = 11 calls in 60 seconds (should be fine)
- BUT if user records multiple times quickly, calls accumulate

**Fix Required:**

- Implement a global rate limiter for ALL Groq API calls
- Track last call time across both urgency and main analysis
- Enforce minimum time between ANY Groq API call (e.g., 2 seconds)

### Issue #5: Interval Not Properly Cleared on Rapid State Changes

**Location:** `src/hooks/useUrgencyPulse.ts`, lines 99-110

**Problem:**
If `isRecording` toggles rapidly (user clicks record/stop quickly), intervals might not be properly cleaned up.

**Why this is broken:**

- React's useEffect cleanup runs, but if state changes faster than cleanup, multiple intervals can exist
- The `analysisIntervalRef.current` might be overwritten before cleanup runs

**Evidence:**

- Race condition in React's effect lifecycle
- If user clicks record → stop → record quickly, cleanup might not complete

**Fix Required:**

- Always clear interval at the START of the effect (before creating new one)
- Use a more robust cleanup pattern

## Recommended Fixes (Priority Order)

### Fix #1: Remove `segments` from useEffect dependencies (HIGHEST PRIORITY)

```typescript
// BEFORE (BROKEN):
useEffect(() => {
  // ... interval setup
}, [isRecording, segments, formatTranscript, analyzeUrgency]);

// AFTER (FIXED):
useEffect(() => {
  if (!isRecording) {
    // cleanup
    return;
  }

  // Use segments from closure, don't recreate interval on segment changes
  const intervalId = window.setInterval(() => {
    // Access current segments via closure or ref
    const currentSegments = segments; // or use a ref
    const transcript = formatTranscript(currentSegments);
    if (transcript.trim()) {
      analyzeUrgency(transcript);
    }
  }, 6000);

  analysisIntervalRef.current = intervalId;

  return () => {
    if (analysisIntervalRef.current !== null) {
      window.clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
  };
}, [isRecording, formatTranscript, analyzeUrgency]); // REMOVED segments
```

### Fix #2: Add Global Rate Limiter

Create a new file `src/services/rateLimiter.ts`:

```typescript
class GroqRateLimiter {
  private lastCallTime: number = 0;
  private minIntervalMs: number = 2000; // 2 seconds between ANY calls

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - timeSinceLastCall;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();
  }
}

export const groqRateLimiter = new GroqRateLimiter();
```

Then use it in both `urgencyDetection.ts` and `groq.ts`:

```typescript
// In detectUrgency():
import { groqRateLimiter } from './rateLimiter';

export async function detectUrgency(...) {
  // ... existing checks

  await groqRateLimiter.waitIfNeeded(); // ADD THIS

  const response = await fetch(...);
  // ... rest of function
}

// In analyzeTranscript():
import { groqRateLimiter } from './rateLimiter';

export async function analyzeTranscript(...) {
  // ... existing checks

  await groqRateLimiter.waitIfNeeded(); // ADD THIS

  const response = await fetch(...);
  // ... rest of function
}
```

### Fix #3: Cancel In-Flight Urgency Calls on Stop

```typescript
// In useUrgencyPulse.ts, add AbortController:
const abortControllerRef = useRef<AbortController | null>(null);

// In analyzeUrgency:
const controller = new AbortController();
abortControllerRef.current = controller;

try {
  const assessment = await detectUrgency(transcript, controller.signal);
  // ... rest
} finally {
  if (!controller.signal.aborted) {
    isAnalyzingRef.current = false;
  }
}

// In cleanup:
if (!isRecording) {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  // ... clear interval
}
```

### Fix #4: Remove Immediate Call on Recording Start

```typescript
// REMOVE this block (lines 88-95):
// if (segments.length > 0) {
//   const transcript = formatTranscript(segments);
//   if (transcript.trim()) {
//     analyzeUrgency(transcript);
//     lastAnalysisTimeRef.current = Date.now();
//   }
// }

// Let the interval handle the first call after 6 seconds
```

### Fix #5: Add Delay Before Main Analysis

```typescript
// In HomePage.tsx, line 172:
useEffect(() => {
  if (state === "processing" && segments.length > 0) {
    // Wait 2 seconds to ensure urgency calls have completed
    const timeoutId = setTimeout(() => {
      // ... existing analysis code
    }, 2000);

    return () => clearTimeout(timeoutId);
  }
}, [state, segments, completeProcessing]);
```

## Testing Strategy

After applying fixes:

1. **Test single recording:**

   - Record for 60 seconds
   - Should see urgency pulse update ~10 times (every 6 seconds)
   - Main analysis should succeed without rate limit

2. **Test rapid re-recording:**

   - Record for 30 seconds, stop
   - Immediately start new recording
   - Should not hit rate limits

3. **Test with network delays:**

   - Throttle network in DevTools (Slow 3G)
   - Record and verify calls don't overlap

4. **Monitor API calls:**
   - Open Network tab in DevTools
   - Filter by "groq.com"
   - Verify minimum 2 seconds between calls

## Expected Behavior After Fix

- Urgency pulse calls every 6 seconds during recording
- Minimum 2 seconds between ANY Groq API calls (global rate limiter)
- No overlapping calls when recording stops
- Main analysis waits if needed to respect rate limits
- No rate limit errors under normal usage

## Files to Modify

1. `src/hooks/useUrgencyPulse.ts` - Fix interval dependencies, remove immediate call
2. `src/services/rateLimiter.ts` - NEW FILE - Global rate limiter
3. `src/services/urgencyDetection.ts` - Add rate limiter, add AbortController support
4. `src/services/groq.ts` - Add rate limiter
5. `src/pages/HomePage.tsx` - Add delay before main analysis

## Additional Notes

- Groq free tier typically allows 30 requests/minute
- With fixes: Max ~30 calls/minute (1 every 2 seconds) = safe margin
- Urgency pulse at 6-second intervals = 10 calls/minute max
- Main analysis = 1 call per session
- Total: Well under 30/minute limit
