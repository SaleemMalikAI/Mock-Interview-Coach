import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { RoleIcon } from "@/components/role-icon";
import { StatusBadge } from "@/components/status-badge";
import type { InterviewSummary } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { INTERVIEW_TYPES, LEVELS, ROLES, labelFor } from "@/lib/interview-options";

export function InterviewList({ interviews, bare = false }: { interviews: InterviewSummary[]; bare?: boolean }) {
  return (
    <ul className={bare ? "divide-y" : "divide-y overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-soft)]"}>
      {interviews.map((interview) => (
        <li key={interview.id}>
          <Link
            href={`/interview/${interview.id}`}
            className="group flex items-center gap-4 px-4 py-4 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/60 sm:px-5"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-subtle text-primary">
              <RoleIcon role={interview.role} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {labelFor(ROLES, interview.role)} · {labelFor(LEVELS, interview.level)}
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {labelFor(INTERVIEW_TYPES, interview.type)} · {interview.answered}/{interview.num_questions} answered ·{" "}
                {timeAgo(interview.created_at)}
              </span>
            </span>
            <span className="hidden sm:block">
              <StatusBadge status={interview.status} />
            </span>
            {interview.overall_score !== null ? (
              <span className="font-mono text-sm font-semibold tabular">{interview.overall_score.toFixed(1)}</span>
            ) : null}
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
