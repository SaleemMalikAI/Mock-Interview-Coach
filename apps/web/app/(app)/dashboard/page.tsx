import {
  ArrowRight,
  BookOpenCheck,
  CircleCheck,
  Clock,
  Flame,
  Gauge,
  History,
  Library,
  Play,
  Plus,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivityChart } from "@/components/activity-chart";
import { GoalRing } from "@/components/goal-ring";
import { InterviewList } from "@/components/interview-list";
import { KpiTile } from "@/components/kpi-tile";
import { RoleIcon } from "@/components/role-icon";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch, type InterviewSummary, type Stats } from "@/lib/api";
import { INTERVIEW_TYPES, LEVELS, ROLES, labelFor } from "@/lib/interview-options";
import { createClient, getAccessToken } from "@/lib/supabase/server";
import { displayName, formatMinutes, initialsOf } from "@/lib/format";
import { userTimezone } from "@/lib/user";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const WEEKLY_GOAL_MINUTES = 30;

const QUICK_LINKS = [
  { href: "/questions", icon: Library, title: "Question bank", body: "Practice any single question" },
  { href: "/stories", icon: BookOpenCheck, title: "STAR stories", body: "Prepare behavioral answers" },
  { href: "/interviews", icon: History, title: "History", body: "Review past interviews" },
] as const;

function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login?next=/dashboard");
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims.email === "string" ? data.claims.email : "";
  const tz = await userTimezone();

  const [stats, interviews] = await Promise.all([
    apiFetch<Stats>(`/stats${tz ? `?tz=${encodeURIComponent(tz)}` : ""}`, { token, cache: "no-store" }).catch(() => null),
    apiFetch<InterviewSummary[]>("/interviews", { token, cache: "no-store" }).catch(() => null),
  ]);

  if (!stats || !interviews) {
    return (
      <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="font-semibold text-destructive">We couldn&apos;t load your dashboard.</p>
        <p className="mt-1 text-sm text-muted-foreground">The API may be offline. Refresh the page to try again.</p>
      </div>
    );
  }

  const name = displayName(email);
  // Only interviews with questions left to answer can be resumed.
  const resume = interviews.find(
    (i) => (i.status === "in_progress" || i.status === "setup") && i.answered < i.num_questions,
  );
  const weekRemaining = Math.max(0, WEEKLY_GOAL_MINUTES - stats.week_minutes);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] sm:px-6">
        <div className="bg-dots absolute inset-0 [mask-image:linear-gradient(to_left,black,transparent_60%)]" aria-hidden />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.58_0.2_300)] text-xl font-semibold text-primary-foreground shadow-[var(--shadow-soft)]">
              {initialsOf(name)}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <h1 className="truncate text-2xl font-semibold">{name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Flame className="size-4 text-recording" aria-hidden />
                  {stats.current_streak}-day streak
                </span>
                <span className="inline-flex items-center gap-1">
                  <Trophy className="size-4 text-warning" aria-hidden />
                  Best {stats.longest_streak} days
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {resume ? (
              <Link href={`/interview/${resume.id}`} className={buttonVariants({ size: "lg", variant: "outline" })}>
                <Play data-icon="inline-start" aria-hidden />
                Resume interview
              </Link>
            ) : null}
            <Link href="/interview/new" className={buttonVariants({ size: "lg" })}>
              <Plus data-icon="inline-start" aria-hidden />
              New interview
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Your numbers" className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          icon={Flame}
          tone="recording"
          label="Current streak"
          value={String(stats.current_streak)}
          unit={stats.current_streak === 1 ? "day" : "days"}
          hint={stats.current_streak ? "Answer today to keep it going" : "Answer a question to start one"}
        />
        <KpiTile
          icon={Clock}
          label="Practice this week"
          value={formatMinutes(stats.week_minutes)}
          unit="min"
          hint={`${formatMinutes(stats.total_minutes)} min all time`}
        />
        <KpiTile
          icon={CircleCheck}
          tone="success"
          label="Questions answered"
          value={String(stats.answered)}
          hint={`Across ${stats.interviews} ${stats.interviews === 1 ? "interview" : "interviews"}`}
        />
        <KpiTile
          icon={Gauge}
          tone="warning"
          label="Average score"
          value={stats.average_score !== null ? stats.average_score.toFixed(1) : "—"}
          unit={stats.average_score !== null ? "/ 10" : undefined}
          hint={stats.average_score !== null ? `Best ${stats.best_score?.toFixed(1)}` : "Appears once answers are scored"}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel title="Activity" action={<span className="text-xs text-muted-foreground">Answers per day · last 14 days</span>}>
          {stats.answered === 0 ? (
            <div className="grid h-44 place-items-center rounded-xl border border-dashed text-center text-sm text-muted-foreground">
              <p>
                No activity yet.{" "}
                <Link href="/interview/new" className="font-medium text-primary underline-offset-4 hover:underline">
                  Answer your first question
                </Link>
              </p>
            </div>
          ) : (
            <ActivityChart activity={stats.activity} />
          )}
        </Panel>

        <Panel title="Weekly goal">
          <div className="flex flex-col items-center text-center">
            <GoalRing value={stats.week_minutes} goal={WEEKLY_GOAL_MINUTES} label="Practice minutes this week" />
            <p className="mt-4 text-sm font-medium">
              {weekRemaining === 0 ? "Goal reached. Great consistency!" : `${Math.ceil(weekRemaining)} min to go this week`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Counted from your recorded answer time.</p>
          </div>
        </Panel>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel
          title="Recent interviews"
          action={
            interviews.length ? (
              <Link href="/interviews" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            ) : null
          }
        >
          {interviews.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">No interviews yet</p>
              <p className="mt-1 text-sm text-muted-foreground">A three-question round takes about ten minutes.</p>
              <Link href="/interview/new" className={cn(buttonVariants(), "mt-4")}>
                Start your first interview
              </Link>
            </div>
          ) : (
            <div className="-mx-4 -mb-4 border-t sm:-mx-5 sm:-mb-5">
              <InterviewList interviews={interviews.slice(0, 5)} bare />
            </div>
          )}
        </Panel>

        <div className="min-w-0 space-y-5">
          {resume ? (
            <Panel title="Continue where you left off">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-subtle text-primary">
                  <RoleIcon role={resume.role} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {labelFor(ROLES, resume.role)} · {labelFor(LEVELS, resume.level)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {labelFor(INTERVIEW_TYPES, resume.type)} · {resume.answered}/{resume.num_questions} answered
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(resume.answered / resume.num_questions) * 100}%` }}
                />
              </div>
              <Link href={`/interview/${resume.id}`} className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full")}>
                Resume
              </Link>
            </Panel>
          ) : null}

          <Panel title="Quick links">
            <ul className="-mx-2 space-y-1">
              {QUICK_LINKS.map(({ href, icon: Icon, title, body }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
                    <span className="grid size-9 place-items-center rounded-lg bg-muted text-foreground group-hover:bg-card">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{body}</span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
