import { Check } from "lucide-react";

import type { InterviewTurn } from "@/lib/api";
import { cn } from "@/lib/utils";

type QuestionStepsProps = {
  turns: InterviewTurn[];
  currentId: string;
  onSelect: (id: string) => void;
};

export function QuestionSteps({ turns, currentId, onSelect }: QuestionStepsProps) {
  return (
    <ol className="space-y-1">
      {turns.map((turn) => {
        const current = turn.id === currentId;
        const done = turn.status === "answered" || turn.status === "evaluated";
        return (
          <li key={turn.id}>
            <button
              type="button"
              onClick={() => onSelect(turn.id)}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex w-full cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                current ? "bg-accent" : "hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "mt-px grid size-6 shrink-0 place-items-center rounded-full border font-mono text-xs font-semibold",
                  done && "border-success bg-success text-success-foreground",
                  current && !done && "border-primary text-primary",
                )}
              >
                {done ? <Check className="size-3.5" aria-label="Answered" /> : turn.position}
              </span>
              <span className={cn("line-clamp-2", current ? "font-medium text-foreground" : "text-muted-foreground")}>
                {turn.question}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
