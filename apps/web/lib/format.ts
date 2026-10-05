const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = (new Date(iso).getTime() - now.getTime()) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) {
      return relative.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** "saleem.malik@x.com" -> "Saleem Malik", "saleemalik444@x.com" -> "Saleemalik".
 * Digits are stripped; parts left with fewer than 3 letters ("e2e", "99") are dropped. */
export function displayName(email: string): string {
  const local = email.split("@")[0] ?? "";
  const name = local
    .split(/[._+-]+/)
    .map((part) => part.replace(/\d+/g, ""))
    .filter((part) => part.length >= 3)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
  return name || local || "there";
}

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "?";
}

/** Minutes for display: "<1" for a few seconds of practice, otherwise rounded. */
export function formatMinutes(minutes: number): string {
  if (minutes > 0 && minutes < 1) return "<1";
  return String(Math.round(minutes));
}
