"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  /** Tailwind color token to stroke the ring with, e.g. "var(--color-primary)". */
  color: string;
  trackColor?: string;
  label: string;
  centerText: string;
  onClick?: () => void;
  className?: string;
}

/** A single circular progress indicator, Apple-Health style. */
export function ProgressRing({
  value,
  max,
  size = 92,
  strokeWidth = 9,
  color,
  trackColor = "var(--color-muted)",
  label,
  centerText,
  onClick,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const offset = circumference * (1 - pct);

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `${label}: ${centerText}. Tap to log more.` : undefined}
      className={cn(
        "flex flex-col items-center gap-2",
        onClick && "outline-none transition-transform duration-150 active:scale-95",
        className,
      )}
    >
      <span
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
        role={onClick ? undefined : "img"}
        aria-label={onClick ? undefined : `${label}: ${centerText}`}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-sm font-semibold leading-none">{centerText}</span>
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </Wrapper>
  );
}
