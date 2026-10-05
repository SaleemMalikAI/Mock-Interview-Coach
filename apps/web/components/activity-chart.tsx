import type { DayActivity } from "@/lib/api";
import { cn } from "@/lib/utils";

const weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });

function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** Answers per day for the last 14 days. One series, so no legend: the card title names it.
 * Each bar has a hover/focus tooltip and the data is repeated in a screen-reader table. */
export function ActivityChart({ activity }: { activity: DayActivity[] }) {
  const max = Math.max(1, ...activity.map((d) => d.answers));
  const ticks = max <= 4 ? [max] : [Math.ceil(max / 2), max];

  return (
    <figure className="space-y-3">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-6" aria-hidden>
          {[...ticks].reverse().map((tick) => (
            <div key={tick} className="flex items-center gap-2" style={{ height: 0 }}>
              <span className="w-5 text-right font-mono text-[0.65rem] text-muted-foreground tabular">{tick}</span>
              <span className="h-px flex-1 border-t border-dashed border-border" />
            </div>
          ))}
          <div className="flex items-center gap-2" style={{ height: 0 }}>
            <span className="w-5 text-right font-mono text-[0.65rem] text-muted-foreground tabular">0</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </div>

        <ol className="relative ml-7 flex h-44 items-end gap-[2px] pb-6" aria-hidden>
          {activity.map((d, index) => {
            const date = parseDay(d.day);
            const isToday = index === activity.length - 1;
            return (
              <li
                key={d.day}
                tabIndex={0}
                className="group relative flex h-full flex-1 cursor-default flex-col items-center justify-end outline-none"
              >
                <span
                  className={cn(
                    "w-full max-w-5 rounded-t-[4px] transition-opacity",
                    d.answers > 0 ? "bg-chart-1 group-hover:opacity-80 group-focus-visible:opacity-80" : "bg-transparent",
                  )}
                  style={{ height: d.answers > 0 ? `${(d.answers / max) * 100}%` : 0 }}
                />
                <span
                  className={cn(
                    "absolute -bottom-6 font-mono text-[0.65rem] tabular",
                    isToday ? "font-semibold text-foreground" : "text-muted-foreground",
                    index % 2 === 1 && !isToday && "hidden sm:inline",
                  )}
                >
                  {weekday.format(date).slice(0, 2)}
                </span>
                <span className="pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max rounded-lg border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-[var(--shadow-lift)] group-hover:block group-focus-visible:block">
                  <span className="block font-medium">{fullDate.format(date)}</span>
                  <span className="block text-muted-foreground">
                    {d.answers} {d.answers === 1 ? "answer" : "answers"} · {d.minutes} min
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <table className="sr-only">
        <caption>Answers per day, last 14 days</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Answers</th>
            <th>Minutes</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((d) => (
            <tr key={d.day}>
              <td>{fullDate.format(parseDay(d.day))}</td>
              <td>{d.answers}</td>
              <td>{d.minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
