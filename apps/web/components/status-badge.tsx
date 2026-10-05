import type { Interview } from "@/lib/api";
import { cn } from "@/lib/utils";

const STYLES: Record<Interview["status"], { label: string; className: string }> = {
  setup: { label: "Not started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", className: "bg-warning/15 text-[oklch(0.45_0.12_70)] dark:text-warning" },
  completed: { label: "Completed", className: "bg-success/12 text-success" },
  abandoned: { label: "Abandoned", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: Interview["status"] }) {
  const { label, className } = STYLES[status];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium", className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}
