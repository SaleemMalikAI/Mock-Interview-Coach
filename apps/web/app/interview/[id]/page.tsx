import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ApiError, apiFetch, type Interview } from "@/lib/api";
import { INTERVIEW_TYPES, LEVELS, ROLES, labelFor } from "@/lib/interview-options";
import { getAccessToken } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Interview · Mock Interview Coach" };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadInterview(id: string, token: string): Promise<Interview> {
  try {
    return await apiFetch<Interview>(`/interviews/${id}`, { token, cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export default async function InterviewRoomPage({ params }: PageProps<"/interview/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    notFound();
  }
  const token = await getAccessToken();
  if (!token) {
    redirect(`/login?next=/interview/${id}`);
  }
  const interview = await loadInterview(id, token);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p className="text-sm text-muted-foreground">
        {labelFor(ROLES, interview.role)} · {labelFor(LEVELS, interview.level)} ·{" "}
        {labelFor(INTERVIEW_TYPES, interview.type)} · {interview.num_questions} questions
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Interview room</h1>
      {interview.turns.length === 0 ? (
        <section className="mt-8 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No questions were planned for this interview. Please start a new one.
        </section>
      ) : (
        <section className="mt-8 space-y-3" aria-labelledby="plan-heading">
          {/* Temporary preview until the recording room (F4) shows one question at a time. */}
          <h2 id="plan-heading" className="text-sm font-medium text-muted-foreground">
            {interview.turns.length} questions ready
          </h2>
          <ol className="space-y-2">
            {interview.turns.map((turn) => (
              <li key={turn.id} className="flex gap-3 rounded-lg border p-3 text-sm">
                <span className="font-medium text-muted-foreground">{turn.position}.</span>
                <span className="flex-1">{turn.question}</span>
                {turn.source === "jd" ? (
                  <span className="h-fit shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                    From JD
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
