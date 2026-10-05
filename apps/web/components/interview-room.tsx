"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, FileText, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { AnswerRecorder } from "@/components/answer-recorder";
import { QuestionSteps } from "@/components/question-steps";
import { RoleIcon } from "@/components/role-icon";
import { TranscriptCard } from "@/components/transcript-card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { AnswerResult, Interview, InterviewTurn } from "@/lib/api";
import { INTERVIEW_TYPES, LEVELS, ROLES, labelFor } from "@/lib/interview-options";
import { cn } from "@/lib/utils";

function isDone(turn: InterviewTurn): boolean {
  return turn.status === "answered" || turn.status === "evaluated";
}

export function InterviewRoom({ interview }: { interview: Interview }) {
  const [turns, setTurns] = useState(interview.turns);
  const [currentId, setCurrentId] = useState(() => (turns.find((t) => !isDone(t)) ?? turns[0])?.id ?? "");
  // Turns the user chose to answer again; show the recorder instead of the transcript.
  const [rerecording, setRerecording] = useState<Set<string>>(new Set());

  const current = turns.find((t) => t.id === currentId);
  const answeredCount = turns.filter(isDone).length;
  const allDone = answeredCount === turns.length;
  const nextPending = useMemo(
    () => turns.find((t) => !isDone(t) && t.id !== currentId) ?? null,
    [turns, currentId],
  );

  const handleAnswered = useCallback((result: AnswerResult) => {
    setTurns((previous) =>
      previous.map((t) =>
        t.id === result.turn_id
          ? { ...t, status: "answered", transcript: result.transcript, duration_seconds: result.duration_seconds }
          : t,
      ),
    );
    setRerecording((previous) => {
      const next = new Set(previous);
      next.delete(result.turn_id);
      return next;
    });
    toast.success("Answer saved");
  }, []);

  if (!current) {
    return null;
  }

  const showRecorder = !isDone(current) || rerecording.has(current.id);
  const progress = Math.round((answeredCount / turns.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          Dashboard
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <RoleIcon role={interview.role} className="size-3.5 text-primary" />
          {labelFor(ROLES, interview.role)} · {labelFor(LEVELS, interview.level)} · {labelFor(INTERVIEW_TYPES, interview.type)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold">
            Question {current.position} <span className="font-normal text-muted-foreground">of {turns.length}</span>
          </span>
          <span className="font-mono text-xs text-muted-foreground tabular">{answeredCount} answered</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={turns.length}
          aria-label="Questions answered"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section aria-labelledby="question-heading" className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-subtle px-2.5 py-1 font-mono text-xs font-semibold text-primary">
              Q{current.position}
            </span>
            {current.source === "jd" ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <FileText className="size-3" aria-hidden />
                From your job description
              </span>
            ) : null}
            {isDone(current) && !showRecorder ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="size-3" aria-hidden />
                Answered
              </span>
            ) : null}
          </div>

          <h1 id="question-heading" className="mt-5 text-xl leading-snug font-semibold text-pretty [text-wrap:pretty] sm:text-2xl">
            {current.question}
          </h1>

          <div className="mt-8 border-t pt-8">
            {showRecorder ? (
              <AnswerRecorder
                key={current.id}
                interviewId={interview.id}
                turnId={current.id}
                onAnswered={handleAnswered}
              />
            ) : (
              <div className="space-y-5">
                <TranscriptCard
                  transcript={current.transcript ?? ""}
                  durationSeconds={current.duration_seconds}
                  onRerecord={
                    current.status === "answered"
                      ? () => setRerecording((previous) => new Set(previous).add(current.id))
                      : undefined
                  }
                />
                {nextPending ? (
                  <div className="flex justify-end">
                    <Button size="lg" onClick={() => setCurrentId(nextPending.id)}>
                      Next question
                      <ArrowRight data-icon="inline-end" aria-hidden />
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          {allDone ? (
            <div className="rounded-2xl border border-success/30 bg-success/8 p-5">
              <PartyPopper className="size-6 text-success" aria-hidden />
              <p className="mt-3 font-semibold">All questions answered</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nice work. Scored feedback for each answer and your full report are coming in the next update.
              </p>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full bg-card")}>
                Back to dashboard
              </Link>
            </div>
          ) : null}
          <div className="rounded-2xl border bg-card p-3 shadow-[var(--shadow-soft)]">
            <p className="px-2.5 pt-1.5 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Questions</p>
            <QuestionSteps turns={turns} currentId={current.id} onSelect={setCurrentId} />
          </div>
        </aside>
      </div>
    </div>
  );
}
