/**
 * Format a date for display
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a date and time for display
 */
export function formatDateTime(date: Date = new Date()): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date for filenames (no spaces or special chars)
 */
export function formatDateForFilename(date: Date = new Date()): string {
  return date.toISOString().split("T")[0] || "unknown-date";
}

/**
 * Sanitize a string for use in a filename
 */
export function sanitizeFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
