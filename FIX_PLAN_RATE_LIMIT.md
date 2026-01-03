# Rate Limit Fix Plan

## Root Causes

### 1. Rate Limiter Doesn't Prevent Concurrent In-Flight Requests

**Location:** `src/services/rateLimiter.ts:13-23`

**Problem:**

- `waitForRateLimit()` only checks time since last call STARTED, not if a call is currently in-flight
- Two calls can both pass the wait check and both start fetching simultaneously
- Example: Urgency call at T=0, main analysis at T=1.5s → both pass wait check → both fetch → 429 error

**Evidence:**

- Rate limiter updates `lastCallTime` immediately (line 22), not when fetch completes
- No tracking of in-flight requests
- Multiple calls can be in `fetch()` simultaneously

### 2. Urgency Pulse In-Flight Calls Not Cancelled on Stop

**Location:** `src/hooks/useUrgencyPulse.ts:89-114` and `src/services/urgencyDetection.ts:98-110`

**Problem:**

- When recording stops, interval is cleared (line 93) but async `detectUrgency()` calls continue
- Main analysis starts immediately when state becomes "processing" (HomePage.tsx:174)
- Both urgency and main analysis can be in-flight at the same time

**Evidence:**

- No AbortController to cancel fetch requests
- `isAnalyzingRef` only prevents new calls, doesn't cancel existing ones
- Cleanup happens synchronously, but fetch is async

### 3. Rate Limiter Updates Time Too Early

**Location:** `src/services/rateLimiter.ts:22`

**Problem:**

- `lastCallTime` is updated BEFORE the fetch completes
- If call takes 3 seconds, next call can start 2 seconds after first call started (not finished)
- Doesn't account for actual API call duration

**Evidence:**

- Line 22: `lastCallTime = Date.now()` happens before `fetch()` completes
- Should update after fetch completes, not before

### 4. Test Transcript Mode - Urgency Pulse Should Be Disabled

**Location:** `src/pages/HomePage.tsx:67-70`

**Problem:**

- Urgency pulse is called with `state === "recording"` which should prevent it in test mode
- BUT: If test transcript is loaded and user somehow triggers recording state, urgency could run
- Need explicit check to disable urgency during test transcript mode

**Evidence:**

- Line 69: `state === "recording"` should prevent it, but need to verify no edge cases

### 5. No 429 Cooldown/Backoff Strategy

**Location:** `src/services/groq.ts:296-300` and `src/services/urgencyDetection.ts:113-115`

**Problem:**

- 429 errors are returned but no cooldown period enforced
- User can immediately retry → hits rate limit again
- No UI feedback about cooldown period

**Evidence:**

- Both services return 429 but don't set a global cooldown state
- No retry logic with backoff
- No UI disable during cooldown

---

## Fix Plan (Ordered Steps)

### Step 1: Add Global In-Flight Request Lock

**File:** `src/services/rateLimiter.ts`

**Changes:**

- Add `isRequestInFlight: boolean` flag
- Modify `waitForRateLimit()` to:
  1. Wait for time since last call
  2. Wait for any in-flight request to complete
  3. Set `isRequestInFlight = true` before returning
- Add `markRequestComplete()` function to set `isRequestInFlight = false` after fetch completes
- Update `lastCallTime` AFTER fetch completes, not before

**Why:** Ensures only ONE Groq request is in-flight at any time globally.

### Step 2: Update Both Services to Use Request Lock

**Files:** `src/services/groq.ts` and `src/services/urgencyDetection.ts`

**Changes:**

- Call `waitForRateLimit()` before fetch (already done)
- Call `markRequestComplete()` in `finally` block after fetch completes
- Update `lastCallTime` in `markRequestComplete()`, not in `waitForRateLimit()`

**Why:** Guarantees sequential execution of all Groq API calls.

### Step 3: Add AbortController to Cancel In-Flight Urgency Calls

**File:** `src/hooks/useUrgencyPulse.ts`

**Changes:**

- Add `abortControllerRef = useRef<AbortController | null>(null)`
- In `analyzeUrgency()`: Create new AbortController, store in ref
- Pass `signal` to `detectUrgency()` (need to update function signature)
- In cleanup (line 90-96): Call `abortControllerRef.current?.abort()` before clearing interval

**File:** `src/services/urgencyDetection.ts`

**Changes:**

- Add optional `signal?: AbortSignal` parameter to `detectUrgency()`
- Pass `signal` to `fetch()` options
- Handle abort in catch block

**Why:** Cancels urgency calls immediately when recording stops, preventing overlap with main analysis.

### Step 4: Add Delay Before Main Analysis Starts

**File:** `src/pages/HomePage.tsx:173-198`

**Changes:**

- When state becomes "processing", wait 1-2 seconds before starting analysis
- This ensures any in-flight urgency calls have time to complete/cancel
- Use `setTimeout` in the useEffect

**Why:** Extra safety buffer to ensure urgency pulse is fully stopped before main analysis.

### Step 5: Explicitly Disable Urgency Pulse in Test Transcript Mode

**File:** `src/pages/HomePage.tsx:67-70`

**Changes:**

- Add check: `state === "recording" && !isTestTranscriptMode`
- Add state: `const [isTestTranscriptMode, setIsTestTranscriptMode] = useState(false)`
- Set `isTestTranscriptMode = true` in `loadTestTranscript()`
- Reset to `false` in `handleReset()`

**Why:** Explicitly prevents urgency pulse from running during test transcript mode.

### Step 6: Add 429 Cooldown with UI Feedback

**File:** `src/services/rateLimiter.ts`

**Changes:**

- Add `cooldownUntil: number = 0` to track cooldown end time
- Add `setCooldown(seconds: number)` function
- Modify `waitForRateLimit()` to also wait for cooldown if active
- Export `isInCooldown()` function

**File:** `src/services/groq.ts:296-300`

**Changes:**

- When 429 detected, call `setCooldown(15)` (15 second cooldown)
- Return error with cooldown info

**File:** `src/pages/HomePage.tsx`

**Changes:**

- Import `isInCooldown` from rateLimiter
- Disable "Analyze Transcript" button when in cooldown
- Show cooldown countdown in error message: "Rate limit exceeded. Please wait X seconds."

**Why:** Prevents spam retries and gives user clear feedback about when they can retry.

### Step 7: Add Retry Logic with Exponential Backoff (Optional)

**File:** `src/pages/HomePage.tsx:180-196`

**Changes:**

- If 429 error, wait for cooldown, then auto-retry once
- Use exponential backoff (wait cooldown time + 2 seconds)
- Only retry once, then show error

**Why:** Better UX - automatically retries after cooldown instead of requiring manual retry.

---

## Files to Edit

1. **`src/services/rateLimiter.ts`**

   - Add in-flight request lock
   - Add cooldown tracking
   - Update timing logic

2. **`src/services/groq.ts`**

   - Use request lock properly
   - Handle 429 with cooldown
   - Mark request complete in finally

3. **`src/services/urgencyDetection.ts`**

   - Add AbortSignal support
   - Use request lock properly
   - Mark request complete in finally

4. **`src/hooks/useUrgencyPulse.ts`**

   - Add AbortController
   - Cancel in-flight calls on stop
   - Pass signal to detectUrgency

5. **`src/pages/HomePage.tsx`**
   - Add test transcript mode flag
   - Add delay before main analysis
   - Disable analyze button during cooldown
   - Show cooldown countdown
   - Optional: Add retry logic

---

## Test Checklist

### Test 1: Test Transcript Mode

- [ ] Load test transcript
- [ ] Click "Analyze Transcript"
- [ ] Verify analysis succeeds on first try
- [ ] Check Network tab: Only ONE request to groq.com
- [ ] Verify urgency pulse never runs (check console for urgency calls)

### Test 2: Normal Recording Flow

- [ ] Start recording
- [ ] Record for 30 seconds
- [ ] Stop recording
- [ ] Verify analysis succeeds on first try
- [ ] Check Network tab: Urgency calls stop before main analysis starts
- [ ] Verify no 429 errors in console

### Test 3: Rapid Re-Recording

- [ ] Record for 10 seconds, stop
- [ ] Immediately start new recording
- [ ] Record for 10 seconds, stop
- [ ] Verify no 429 errors
- [ ] Check Network tab: Minimum 2 seconds between all calls

### Test 4: 429 Error Handling

- [ ] Manually trigger rate limit (if possible) or wait for natural occurrence
- [ ] Verify "Analyze" button is disabled during cooldown
- [ ] Verify cooldown countdown shows in error message
- [ ] Wait for cooldown to expire
- [ ] Verify button re-enables
- [ ] Verify retry works (if retry logic implemented)

### Test 5: Urgency Pulse Cancellation

- [ ] Start recording
- [ ] Wait for urgency pulse to make at least one call
- [ ] Immediately stop recording
- [ ] Check Network tab: Verify in-flight urgency call is cancelled (aborted)
- [ ] Verify main analysis starts without overlap

### Test 6: Concurrent Request Prevention

- [ ] Add console.log in rateLimiter to track in-flight state
- [ ] Load test transcript and analyze
- [ ] Verify logs show: request starts → completes → next request starts
- [ ] Never see two requests "in-flight" simultaneously

---

## Expected Behavior After Fix

1. **Only ONE Groq API call in-flight at any time** (global lock)
2. **Urgency pulse stops immediately** when recording stops (AbortController)
3. **Main analysis waits** 1-2 seconds after stop to ensure urgency is done
4. **Test transcript mode** explicitly disables urgency pulse
5. **429 errors** trigger 15-second cooldown with UI feedback
6. **No overlapping requests** even under rapid user actions

---

## Implementation Priority

**Critical (Must Fix):**

- Step 1: Global in-flight lock
- Step 2: Update services to use lock
- Step 3: AbortController for urgency

**Important (Should Fix):**

- Step 4: Delay before main analysis
- Step 5: Explicit test mode check
- Step 6: 429 cooldown with UI

**Nice to Have:**

- Step 7: Auto-retry with backoff
