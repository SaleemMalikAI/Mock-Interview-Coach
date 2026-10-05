import { formatMinutes } from "@/lib/format";

type GoalRingProps = { value: number; goal: number; label: string };

/** Single-value progress ring (a hero number with context, not a chart). */
export function GoalRing({ value, goal, label }: GoalRingProps) {
  const ratio = Math.min(1, value / goal);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid size-36 place-items-center" role="img" aria-label={`${label}: ${value} of ${goal}`}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-muted" />
        {ratio > 0 ? (
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className={ratio >= 1 ? "stroke-success" : "stroke-primary"}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
        ) : null}
      </svg>
      <div className="text-center">
        <p className="font-mono text-3xl font-semibold tabular">{formatMinutes(value)}</p>
        <p className="text-xs text-muted-foreground">of {goal} min</p>
      </div>
    </div>
  );
}
