import { ArrowRight, CircleDashed, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ComingSoonProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  features: { title: string; body: string }[];
  dependsOn: string;
  cta: { href: string; label: string };
};

/** Honest placeholder for a planned feature: what it will do and what it's waiting for. */
export function ComingSoon({ icon: Icon, title, description, features, dependsOn, cta }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-10">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_60%)]" aria-hidden />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-2.5 py-1 text-xs font-semibold text-primary">
            <CircleDashed className="size-3.5" aria-hidden />
            In development
          </span>
          <div className="mt-5 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.58_0.2_300)] text-primary-foreground">
              <Icon className="size-6" aria-hidden />
            </span>
            <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          </div>
          <p className="mt-4 text-muted-foreground">{description}</p>
          <p className="mt-2 text-sm text-muted-foreground">{dependsOn}</p>
          <Link href={cta.href} className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
            {cta.label}
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Link>
        </div>
      </section>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="rounded-xl border bg-card p-5 shadow-[var(--shadow-soft)]">
            <p className="font-medium">{feature.title}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
