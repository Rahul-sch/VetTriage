import { useState, useRef, useEffect } from "react";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  isEdited?: boolean;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}

export function EditableField({
  value,
  onSave,
  isEdited = false,
  multiline = false,
  className = "",
  placeholder = "Click to edit",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const commonProps = {
      ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      value: editValue,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setEditValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className: `w-full px-2 py-1.5 border border-teal-400 dark:border-teal-500 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 ${className}`,
      placeholder,
    };

    if (multiline) {
      return (
        <textarea
          {...commonProps}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={3}
        />
      );
    }

    return (
      <input
        {...commonProps}
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`
        cursor-pointer px-2 py-1 -mx-2 -my-1 rounded-md
        hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors
        group relative
        ${className}
      `}
    >
      <span className={value ? "" : "text-slate-400 dark:text-slate-500 italic"}>
        {value || placeholder}
      </span>

      {/* Edit hint */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-slate-400 dark:text-slate-500">
        <EditIcon />
      </span>

      {/* Edited indicator */}
      {isEdited && (
        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 rounded">
          Edited
        </span>
      )}
    </div>
  );
}

function EditIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 inline"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

