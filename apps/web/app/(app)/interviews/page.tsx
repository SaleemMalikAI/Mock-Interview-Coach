import { History, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FilterChips } from "@/components/filter-chips";
import { InterviewList } from "@/components/interview-list";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch, type InterviewSummary } from "@/lib/api";
import { ROLES } from "@/lib/interview-options";
import { getAccessToken } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Interview history" };

const STATUSES = [
  { value: "in_progress", label: "In progress" },
  { value: "setup", label: "Not started" },
  { value: "completed", label: "Completed" },
] as const;

export default async function InterviewsPage({ searchParams }: PageProps<"/interviews">) {
  const token = await getAccessToken();
  if (!token) redirect("/login?next=/interviews");
  const sp = await searchParams;
  const role = typeof sp.role === "string" ? sp.role : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const interviews = await apiFetch<InterviewSummary[]>("/interviews", { token, cache: "no-store" }).catch(() => null);
  const filtered = (interviews ?? []).filter((i) => (!role || i.role === role) && (!status || i.status === status));
  const params = { role, status };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="Interview history"
        description="Every interview you've started, newest first. Open one to continue or review your answers."
        actions={
          <Link href="/interview/new" className={buttonVariants({ size: "lg" })}>
            <Plus data-icon="inline-start" aria-hidden />
            New interview
          </Link>
        }
      />

      <div className="space-y-2.5 rounded-xl border bg-card p-3 shadow-[var(--shadow-soft)] sm:p-4">
        <FilterChips label="Role" param="role" options={ROLES} current={role ?? null} params={params} basePath="/interviews" />
        <FilterChips label="Status" param="status" options={STATUSES} current={status ?? null} params={params} basePath="/interviews" />
      </div>

      {interviews === null ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          We couldn&apos;t load your interviews. Refresh to try again.
        </p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-subtle text-primary">
            <History className="size-6" aria-hidden />
          </span>
          <p className="mt-4 font-semibold">{interviews.length ? "No interviews match these filters" : "No interviews yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {interviews.length ? "Try a different role or status." : "Your interviews will show up here."}
          </p>
          {interviews.length ? (
            <Link href="/interviews" className={cn(buttonVariants({ variant: "outline" }), "mt-5")}>
              Clear filters
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "interview" : "interviews"}
          </p>
          <InterviewList interviews={filtered} />
        </>
      )}
    </div>
  );
}
