import { CircleCheck, Gauge, Mic, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InterviewList } from "@/components/interview-list";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch, type InterviewSummary } from "@/lib/api";
import { getAccessToken } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-subtle text-primary">
        <Mic className="size-7" aria-hidden />
      </span>
      <h2 className="mt-5 text-lg font-semibold">No interviews yet</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Run your first mock interview. A three-question round takes about ten minutes.
      </p>
      <Link href="/interview/new" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
        <Plus data-icon="inline-start" aria-hidden />
        Start your first interview
      </Link>
    </div>
  );
}

function LoadError() {
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
      <p className="font-medium text-destructive">We couldn&apos;t load your interviews.</p>
      <p className="mt-1 text-muted-foreground">The API may be offline. Refresh the page to try again.</p>
    </div>
  );
}

export default async function DashboardPage() {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login?next=/dashboard");
  }
  const interviews = await apiFetch<InterviewSummary[]>("/interviews", { token, cache: "no-store" }).catch(
    () => null,
  );

  const answered = interviews?.reduce((sum, i) => sum + i.answered, 0) ?? 0;
  const scored = interviews?.filter((i) => i.overall_score !== null) ?? [];
  const average = scored.length
    ? (scored.reduce((sum, i) => sum + (i.overall_score ?? 0), 0) / scored.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Your practice"
        description="Pick up an interview where you left off, or start a new round."
        actions={
          <Link href="/interview/new" className={buttonVariants({ size: "lg" })}>
            <Plus data-icon="inline-start" aria-hidden />
            New interview
          </Link>
        }
      />

      {interviews === null ? (
        <LoadError />
      ) : (
        <>
          <section aria-label="Summary" className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <StatCard icon={Mic} label="Interviews" value={String(interviews.length)} hint="All time" />
            <StatCard icon={CircleCheck} label="Answered" value={String(answered)} hint="Across all interviews" />
            <StatCard icon={Gauge} label="Average score" value={average} hint="Out of 10, once answers are scored" />
          </section>

          <section aria-labelledby="recent-heading" className="space-y-4">
            <h2 id="recent-heading" className="text-lg font-semibold">
              Recent interviews
            </h2>
            {interviews.length === 0 ? <EmptyState /> : <InterviewList interviews={interviews} />}
          </section>
        </>
      )}
    </div>
  );
}
