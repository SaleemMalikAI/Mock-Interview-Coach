import { cn } from "@/lib/utils";

type LevelMeterProps = { levels: number[]; active: boolean; className?: string };

/** Scrolling bar waveform of recent mic levels (newest on the right). */
export function LevelMeter({ levels, active, className }: LevelMeterProps) {
  return (
    <div className={cn("flex h-12 items-center gap-[3px]", className)} aria-hidden>
      {levels.map((level, index) => (
        <span
          key={index}
          className={cn(
            "w-full min-w-[2px] rounded-full transition-[height] duration-75 ease-out",
            active ? "bg-recording/80" : "bg-muted-foreground/25",
          )}
          style={{ height: `${Math.max(8, level * 100)}%` }}
        />
      ))}
    </div>
  );
}
