import { useState, useCallback, useMemo } from "react";
import type { IntakeReport } from "../types/report";

interface UseEditableReportReturn {
  /** The current (possibly edited) report */
  report: IntakeReport;
  /** Original AI-generated report */
  originalReport: IntakeReport;
  /** Set of edited field paths */
  editedFields: Set<string>;
  /** Check if a field was edited */
  isEdited: (fieldPath: string) => boolean;
  /** Update a field value */
  updateField: (fieldPath: string, value: unknown) => void;
  /** Reset all edits */
  resetEdits: () => void;
  /** Check if any edits were made */
  hasEdits: boolean;
}

/**
 * Hook to manage editable report state with change tracking
 */
export function useEditableReport(
  initialReport: IntakeReport
): UseEditableReportReturn {
  const [originalReport] = useState<IntakeReport>(initialReport);
  const [report, setReport] = useState<IntakeReport>(initialReport);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  const isEdited = useCallback(
    (fieldPath: string) => editedFields.has(fieldPath),
    [editedFields]
  );

  const updateField = useCallback(
    (fieldPath: string, value: unknown) => {
      setReport((prev) => {
        const newReport = deepClone(prev);
        setNestedValue(newReport, fieldPath, value);
        return newReport;
      });

      // Check if value differs from original
      const originalValue = getNestedValue(originalReport, fieldPath);
      const isChanged = JSON.stringify(value) !== JSON.stringify(originalValue);

      setEditedFields((prev) => {
        const newSet = new Set(prev);
        if (isChanged) {
          newSet.add(fieldPath);
        } else {
          newSet.delete(fieldPath);
        }
        return newSet;
      });
    },
    [originalReport]
  );

  const resetEdits = useCallback(() => {
    setReport(originalReport);
    setEditedFields(new Set());
  }, [originalReport]);

  const hasEdits = useMemo(() => editedFields.size > 0, [editedFields]);

  return {
    report,
    originalReport,
    editedFields,
    isEdited,
    updateField,
    resetEdits,
    hasEdits,
  };
}

// Helper functions
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function setNestedValue(obj: unknown, path: string, value: unknown): void {
  const keys = path.split(".");
  let current = obj as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1]!;
  current[lastKey] = value;
}

