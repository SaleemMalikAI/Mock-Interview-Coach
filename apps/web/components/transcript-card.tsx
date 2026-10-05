import { Clock, MessageSquareText, RotateCcw, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { countWords, formatDuration } from "@/lib/format";

type TranscriptCardProps = {
  transcript: string;
  durationSeconds: number | null;
  onRerecord?: () => void;
};

export function TranscriptCard({ transcript, durationSeconds, onRerecord }: TranscriptCardProps) {
  const words = countWords(transcript);
  const wpm = durationSeconds ? Math.round(words / (durationSeconds / 60)) : null;
  return (
    <div className="rounded-xl border bg-muted/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquareText className="size-4 text-primary" aria-hidden />
          Your answer
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {durationSeconds ? (
            <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-1 font-mono tabular">
              <Clock className="size-3" aria-hidden />
              {formatDuration(durationSeconds)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-1 font-mono tabular">
            <Type className="size-3" aria-hidden />
            {words} words{wpm ? ` · ${wpm} wpm` : ""}
          </span>
        </div>
      </div>
      <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 text-[0.95rem] leading-relaxed text-foreground/90">
        {transcript}
      </blockquote>
      {onRerecord ? (
        <Button variant="ghost" size="sm" className="mt-4 -ml-2" onClick={onRerecord}>
          <RotateCcw data-icon="inline-start" aria-hidden />
          Record a new answer
        </Button>
      ) : null}
    </div>
  );
}
