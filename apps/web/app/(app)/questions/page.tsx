import { Library } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FilterChips } from "@/components/filter-chips";
import { PageHeader } from "@/components/page-header";
import { PracticeButton } from "@/components/practice-button";
import { RoleIcon } from "@/components/role-icon";
import { SearchBox } from "@/components/search-box";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch, type QuestionPage } from "@/lib/api";
import { LEVELS, ROLES, labelFor } from "@/lib/interview-options";
import { getAccessToken } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Question bank" };

export default async function QuestionsPage({ searchParams }: PageProps<"/questions">) {
  const token = await getAccessToken();
  if (!token) redirect("/login?next=/questions");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const role = typeof sp.role === "string" ? sp.role : undefined;
  const level = typeof sp.level === "string" ? sp.level : undefined;

  const query = new URLSearchParams({ limit: "100" });
  if (q) query.set("q", q);
  if (role) query.set("role", role);
  if (level) query.set("level", level);
  const page = await apiFetch<QuestionPage>(`/questions?${query}`, { token, cache: "no-store" }).catch(() => null);
  const params = { q, role, level };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Question bank"
        title="Browse every question"
        description="Search the curated bank by role, level and topic. Practice any question on its own, with the same recording and feedback as a full interview."
      />

      <div className="space-y-3 rounded-xl border bg-card p-3 shadow-[var(--shadow-soft)] sm:p-4">
        <SearchBox action="/questions" defaultValue={q} placeholder="Search questions or topics" hidden={{ role, level }} />
        <FilterChips label="Role" param="role" options={ROLES} current={role ?? null} params={params} basePath="/questions" />
        <FilterChips label="Level" param="level" options={LEVELS} current={level ?? null} params={params} basePath="/questions" />
      </div>

      {page === null ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          We couldn&apos;t load the question bank. Refresh to try again.
        </p>
      ) : page.items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-subtle text-primary">
            <Library className="size-6" aria-hidden />
          </span>
          <p className="mt-4 font-semibold">No questions match</p>
          <p className="mt-1 text-sm text-muted-foreground">Try fewer words or clear the filters.</p>
          <Link href="/questions" className={cn(buttonVariants({ variant: "outline" }), "mt-5")}>
            Clear search
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {page.total} {page.total === 1 ? "question" : "questions"}
          </p>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-soft)]">
            {page.items.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <span className="hidden size-10 shrink-0 place-items-center rounded-lg bg-brand-subtle text-primary sm:grid">
                  <RoleIcon role={item.role} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{item.question}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                      {labelFor(ROLES, item.role)}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                      {labelFor(LEVELS, item.level)}
                    </span>
                    <span className="rounded-full border px-2 py-0.5 font-medium text-muted-foreground">{item.topic}</span>
                  </div>
                </div>
                <div className="self-end sm:self-center">
                  <PracticeButton questionId={item.id} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
