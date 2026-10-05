"use client";

import { useActionState, useState } from "react";

import { createInterview, type CreateInterviewState } from "@/app/interview/new/actions";
import { OptionGroup } from "@/components/option-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  INTERVIEW_TYPES,
  JOB_DESCRIPTION_MAX_CHARS,
  LEVELS,
  QUESTION_COUNTS,
  ROLES,
  type InterviewType,
  type Level,
  type Role,
} from "@/lib/interview-options";

const initialState: CreateInterviewState = { error: null };
const NON_BEHAVIORAL_TYPES: readonly InterviewType[] = ["technical", "mixed"];

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

  return (
    <form action={formAction} className="space-y-6">
      <OptionGroup name="role" legend="Role" options={ROLES} value={role} onValueChange={changeRole} columns={4} />
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

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="job_description">
            Job description <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <span
            className={remaining < 200 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
            aria-live="polite"
          >
            {remaining.toLocaleString()} characters left
          </span>
        </div>
        <Textarea
          id="job_description"
          name="job_description"
          rows={6}
          maxLength={JOB_DESCRIPTION_MAX_CHARS}
          placeholder="Paste a job posting to get questions tailored to it."
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
        />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Preparing your questions…" : "Start interview"}
      </Button>
    </form>
  );
}
