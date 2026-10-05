"use client";

import { ArrowRight, Clock, FileText, ListChecks, Loader2, Mic } from "lucide-react";
import { useActionState, useState } from "react";

import { createInterview, type CreateInterviewState } from "@/app/(app)/interview/new/actions";
import { OptionGroup } from "@/components/option-group";
import { RoleIcon } from "@/components/role-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  INTERVIEW_TYPES,
  JOB_DESCRIPTION_MAX_CHARS,
  LEVELS,
  MINUTES_PER_QUESTION,
  QUESTION_COUNTS,
  ROLES,
  labelFor,
  type InterviewType,
  type Level,
  type Role,
} from "@/lib/interview-options";
import { cn } from "@/lib/utils";

const initialState: CreateInterviewState = { error: null };
const NON_BEHAVIORAL_TYPES: readonly InterviewType[] = ["technical", "mixed"];

function SummaryRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto text-right font-medium">{value}</span>
    </div>
  );
}

export function InterviewSetupForm() {
  const [state, formAction, pending] = useActionState(createInterview, initialState);
  const [role, setRole] = useState<Role>("full_stack");
  const [level, setLevel] = useState<Level>("mid");
  const [type, setType] = useState<InterviewType>("technical");
  const [numQuestions, setNumQuestions] = useState("5");
  const [jobDescription, setJobDescription] = useState("");

  function changeRole(next: string) {
    const nextRole = next as Role;
    setRole(nextRole);
    // The behavioral track only has behavioral questions.
    if (nextRole === "behavioral") {
      setType("behavioral");
    }
  }

  const remaining = JOB_DESCRIPTION_MAX_CHARS - jobDescription.length;
  const hasJobDescription = jobDescription.trim().length > 0;
  const minutes = Number(numQuestions) * MINUTES_PER_QUESTION;

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-10">
      <div className="space-y-8">
        <OptionGroup
          name="role"
          legend="Role"
          description="Questions come from a curated bank for this track."
          options={ROLES}
          value={role}
          onValueChange={changeRole}
          variant="cards"
          columns={4}
          renderIcon={(value) => <RoleIcon role={value as Role} className="size-4.5" />}
        />
        <OptionGroup
          name="level"
          legend="Level"
          options={LEVELS}
          value={level}
          onValueChange={(next) => setLevel(next as Level)}
        />
        <OptionGroup
          name="type"
          legend="Interview type"
          description={role === "behavioral" ? "The behavioral track is always a behavioral interview." : undefined}
          options={INTERVIEW_TYPES}
          value={type}
          onValueChange={(next) => setType(next as InterviewType)}
          disabledValues={role === "behavioral" ? NON_BEHAVIORAL_TYPES : []}
        />
        <OptionGroup
          name="num_questions"
          legend="Number of questions"
          options={QUESTION_COUNTS}
          value={numQuestions}
          onValueChange={setNumQuestions}
        />

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Label htmlFor="job_description" className="text-sm font-semibold">
                Job description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <p id="jd-help" className="mt-0.5 text-sm text-muted-foreground">
                Paste a posting and 1–2 questions will be written for that role.
              </p>
            </div>
            <span
              className={cn("shrink-0 font-mono text-xs tabular", remaining < 250 ? "text-destructive" : "text-muted-foreground")}
              aria-live="polite"
            >
              {remaining.toLocaleString()} left
            </span>
          </div>
          <Textarea
            id="job_description"
            name="job_description"
            aria-describedby="jd-help"
            rows={7}
            maxLength={JOB_DESCRIPTION_MAX_CHARS}
            placeholder="e.g. Senior Full Stack Engineer — Next.js, TypeScript, FastAPI, PostgreSQL…"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            className="min-h-36"
          />
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-subtle text-primary">
              <RoleIcon role={role} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Your interview</p>
              <p className="truncate font-semibold">
                {labelFor(ROLES, role)} · {labelFor(LEVELS, level)}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t pt-5">
            <SummaryRow icon={ListChecks} label="Format" value={labelFor(INTERVIEW_TYPES, type)} />
            <SummaryRow icon={Mic} label="Questions" value={numQuestions} />
            <SummaryRow icon={Clock} label="About" value={`${minutes} min`} />
            <SummaryRow icon={FileText} label="Job description" value={hasJobDescription ? "Tailored" : "Not added"} />
          </div>

          {state.error ? (
            <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {pending ? "Preparing your questions…" : "Start interview"}
            {pending ? null : <ArrowRight data-icon="inline-end" aria-hidden />}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">You&apos;ll need a microphone. Find a quiet spot.</p>
        </div>
      </aside>
    </form>
  );
}
