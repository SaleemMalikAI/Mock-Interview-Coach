import type { LucideIcon } from "lucide-react";

type StatCardProps = { icon: LucideIcon; label: string; value: string; hint?: string };

export function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-3.5 shadow-[var(--shadow-soft)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs leading-tight text-muted-foreground sm:text-sm">{label}</p>
        <span className="hidden size-8 shrink-0 place-items-center rounded-lg bg-brand-subtle text-primary sm:grid">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tabular tracking-tight sm:mt-3 sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 hidden text-xs text-muted-foreground sm:block">{hint}</p> : null}
    </div>
  );
}
