"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  /** CSS color value to stroke the ring with, e.g. "var(--color-primary)". */
  color: string;
  trackColor?: string;
  label: string;
  /** Bold primary readout, e.g. "0" or "1.2". */
  valueText: string;
  /** Muted readout shown under valueText, e.g. "/ 2,200 kcal". */
  goalText: string;
  onClick?: () => void;
  /** When set alongside onClick, shows a small integrated "+" affordance next to the label. */
  addLabel?: string;
  className?: string;
}

/** A single circular progress indicator, Apple-Health style. */
export function ProgressRing({
  value,
  max,
  size = 100,
  strokeWidth = 9,
  color,
  trackColor = "var(--color-muted)",
  label,
  valueText,
  goalText,
  onClick,
  addLabel,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const offset = circumference * (1 - pct);

  const Wrapper = onClick ? "button" : "div";
  const description = `${label}: ${valueText} ${goalText}`;

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={onClick ? `${description}. Tap to add.` : undefined}
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
        aria-label={onClick ? undefined : description}
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
            style={{ filter: "drop-shadow(0 1px 1.5px rgba(44,38,30,0.18))" }}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <span className="absolute flex flex-col items-center leading-none">
          <span className="text-base font-semibold">{valueText}</span>
          <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">{goalText}</span>
        </span>
      </span>
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        {label}
        {onClick && addLabel ? (
          <span
            aria-hidden
            className="flex size-4 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            <Plus className="size-2.5" strokeWidth={3} />
          </span>
        ) : null}
      </span>
    </Wrapper>
  );
}
