import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type KpiTileProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  hint: string;
  tone?: "brand" | "success" | "warning" | "recording";
};

const TONES = {
  brand: "bg-brand-subtle text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-[oklch(0.5_0.13_70)] dark:text-warning",
  recording: "bg-recording/12 text-recording",
} as const;

export function KpiTile({ icon: Icon, label, value, unit, hint, tone = "brand" }: KpiTileProps) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", TONES[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-mono text-2xl font-semibold tabular tracking-tight">
            {value}
            {unit ? <span className="ml-1 font-sans text-sm font-medium text-muted-foreground">{unit}</span> : null}
          </p>
        </div>
      </div>
      <p className="mt-3 truncate text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
