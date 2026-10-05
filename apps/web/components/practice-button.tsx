"use client";

import { Loader2, Play } from "lucide-react";
import { useActionState } from "react";

import { startPractice, type PracticeState } from "@/app/(app)/questions/actions";
import { Button } from "@/components/ui/button";

const initial: PracticeState = { error: null };

export function PracticeButton({ questionId }: { questionId: string }) {
  const [state, action, pending] = useActionState(startPractice, initial);
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="question_id" value={questionId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} aria-label="Practice this question">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Play data-icon="inline-start" aria-hidden />}
        Practice
      </Button>
      {state.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
