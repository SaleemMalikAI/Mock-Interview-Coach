import { AudioLines } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
  showWordmark?: boolean;
  inverted?: boolean;
  /** Hide the wordmark below 400px, where the app header is tight. */
  compactOnMobile?: boolean;
};

export function Logo({ href = "/", className, showWordmark = true, inverted = false, compactOnMobile = false }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50", className)}
    >
      <span
        className={cn(
          "grid size-8 place-items-center rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105",
          inverted
            ? "bg-white/15 text-white ring-1 ring-white/25"
            : "bg-gradient-to-br from-primary to-[oklch(0.58_0.2_300)] text-primary-foreground",
        )}
      >
        <AudioLines className="size-4.5" aria-hidden />
      </span>
      {compactOnMobile ? <span className="sr-only min-[400px]:hidden">Mock Interview Coach</span> : null}
      {showWordmark ? (
        <span className={cn("text-[0.95rem] font-semibold tracking-tight", inverted && "text-white", compactOnMobile && "hidden min-[400px]:inline")}>
          Mock Interview <span className={inverted ? "text-white/75" : "text-primary"}>Coach</span>
        </span>
      ) : (
        <span className="sr-only">Mock Interview Coach</span>
      )}
    </Link>
  );
}
