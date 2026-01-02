import { useEffect, useState } from "react";
import type { UrgencyAssessment } from "../types/urgency";
// Using inline SVG icons to avoid dependency
function ExclamationTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface UrgencyPulseProps {
  urgency: UrgencyAssessment | null;
  justEscalated: boolean;
  onEscalationAcknowledged: () => void;
}

const urgencyConfig = {
  routine: {
    label: "Routine",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-300",
    glowColor: "shadow-emerald-400",
    icon: CheckCircleIcon,
  },
  monitor: {
    label: "Monitor",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
    glowColor: "shadow-amber-400",
    icon: ExclamationTriangleIcon,
  },
  urgent: {
    label: "Urgent",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    glowColor: "shadow-orange-400",
    icon: ExclamationTriangleIcon,
  },
  emergency: {
    label: "Emergency",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    glowColor: "shadow-red-400",
    icon: ExclamationTriangleIcon,
  },
};

export function UrgencyPulse({
  urgency,
  justEscalated,
  onEscalationAcknowledged,
}: UrgencyPulseProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Show alert and pulse on escalation
  useEffect(() => {
    if (justEscalated && urgency) {
      setShowAlert(true);
      setIsPulsing(true);
      
      // Auto-hide alert after 5 seconds
      const alertTimer = setTimeout(() => {
        setShowAlert(false);
        onEscalationAcknowledged();
      }, 5000);

      // Stop pulsing after animation
      const pulseTimer = setTimeout(() => {
        setIsPulsing(false);
      }, 2000);

      return () => {
        clearTimeout(alertTimer);
        clearTimeout(pulseTimer);
      };
    }
  }, [justEscalated, urgency, onEscalationAcknowledged]);

  if (!urgency) {
    return null;
  }

  const config = urgencyConfig[urgency.level];
  const Icon = config.icon;

  return (
    <div className="relative">
      {/* Main urgency indicator */}
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          ${config.bgColor} ${config.color} ${config.borderColor}
          border-2 font-semibold text-sm
          transition-all duration-300
          ${isPulsing ? "animate-pulse shadow-lg " + config.glowColor : ""}
        `}
      >
        <Icon className="w-5 h-5" />
        <span>{config.label}</span>
        <span className="text-xs opacity-75">({urgency.urgency}/5)</span>
      </div>

      {/* Alert banner on escalation */}
      {showAlert && urgency.alert && (
        <div
          className={`
            absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
            px-4 py-2 rounded-lg shadow-lg
            ${config.bgColor} ${config.color} ${config.borderColor}
            border-2 animate-in fade-in slide-in-from-top-2 duration-300
            max-w-xs text-center
          `}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-medium">{urgency.alert}</p>
          </div>
          <button
            onClick={() => {
              setShowAlert(false);
              onEscalationAcknowledged();
            }}
            className="mt-1 text-xs underline opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

