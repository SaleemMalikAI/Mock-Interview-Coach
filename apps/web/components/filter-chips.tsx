import Link from "next/link";

import { cn } from "@/lib/utils";

type FilterChipsProps = {
  label: string;
  param: string;
  options: readonly { value: string; label: string }[];
  current: string | null;
  /** Other active query params to keep when switching this filter. */
  params: Record<string, string | undefined>;
  basePath: string;
};

function hrefWith(basePath: string, params: Record<string, string | undefined>, key: string, value: string | null) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && k !== key) query.set(k, v);
  }
  if (value) query.set(key, value);
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Server-rendered filter row: plain links, so filters work without JS and are shareable. */
export function FilterChips({ label, param, options, current, params, basePath }: FilterChipsProps) {
  const all = [{ value: "", label: "All" }, ...options];
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label={label}>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      {all.map((option) => {
        const active = (current ?? "") === option.value;
        return (
          <Link
            key={option.value || "all"}
            href={hrefWith(basePath, params, param, option.value || null)}
            aria-current={active ? "true" : undefined}
            scroll={false}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
