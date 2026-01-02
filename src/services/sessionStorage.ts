/**
 * IndexedDB-based session storage for VetTriage
 * Persists ONE active session across page refreshes
 */

import type { TranscriptSegment } from "../types/transcript";
import type { IntakeReport } from "../types/report";

const DB_NAME = "vettriage-session";
const DB_VERSION = 1;
const STORE_NAME = "session";
const SESSION_KEY = "current";

export interface SessionData {
  /** Transcript segments with speaker labels */
  segments: TranscriptSegment[];
  /** Audio recording as Blob */
  audioBlob: Blob | null;
  /** Audio MIME type for playback */
  audioMimeType: string | null;
  /** Recording start time (for relative timestamps) */
  recordingStartTime: number | null;
  /** AI-generated report */
  report: IntakeReport | null;
  /** User-edited report (if different from original) */
  editedReport: IntakeReport | null;
  /** Timestamp when session was saved */
  savedAt: number;
}

/**
 * Open the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Save session data to IndexedDB
 */
export async function saveSession(data: Partial<SessionData>): Promise<void> {
  try {
    const db = await openDB();
    
    // Get existing session first to merge
    const existing = await getSessionInternal(db);
    
    const sessionData: SessionData = {
      segments: data.segments ?? existing?.segments ?? [],
      audioBlob: data.audioBlob !== undefined ? data.audioBlob : (existing?.audioBlob ?? null),
      audioMimeType: data.audioMimeType !== undefined ? data.audioMimeType : (existing?.audioMimeType ?? null),
      recordingStartTime: data.recordingStartTime !== undefined ? data.recordingStartTime : (existing?.recordingStartTime ?? null),
      report: data.report !== undefined ? data.report : (existing?.report ?? null),
      editedReport: data.editedReport !== undefined ? data.editedReport : (existing?.editedReport ?? null),
      savedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(sessionData, SESSION_KEY);

      request.onerror = () => {
        console.error("Failed to save session:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

/**
 * Internal helper to get session without closing db
 */
function getSessionInternal(db: IDBDatabase): Promise<SessionData | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(SESSION_KEY);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result ?? null);
    };
  });
}

/**
 * Load session data from IndexedDB
 */
export async function loadSession(): Promise<SessionData | null> {
  try {
    const db = await openDB();
    const session = await getSessionInternal(db);
    db.close();
    return session;
  } catch (error) {
    console.error("Error loading session:", error);
    return null;
  }
}

/**
 * Clear all session data from IndexedDB
 */
export async function clearSession(): Promise<void> {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(SESSION_KEY);

      request.onerror = () => {
        console.error("Failed to clear session:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error clearing session:", error);
  }
}

/**
 * Check if a session exists
 */
export async function hasSession(): Promise<boolean> {
  const session = await loadSession();
  return session !== null && (session.segments.length > 0 || session.report !== null);
}

/**
 * Create a Blob URL from stored audio blob
 */
export function createAudioUrl(blob: Blob | null): string | null {
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

