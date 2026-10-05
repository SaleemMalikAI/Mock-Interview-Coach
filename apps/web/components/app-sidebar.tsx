"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { displayName } from "@/lib/format";
import { NAV_SECTIONS, isActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = { email: string; onNavigate?: () => void };

export function AppSidebar({ email, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 shrink-0 items-center px-5">
        <Logo href="/dashboard" />
      </div>

      <div className="px-3 pt-2">
        <Link
          href="/interview/new"
          onClick={onNavigate}
          className={cn(buttonVariants({ size: "lg" }), "w-full justify-start shadow-[var(--shadow-soft)]")}
        >
          <Plus data-icon="inline-start" aria-hidden />
          Start interview
        </Link>
      </div>

      <nav aria-label="Main" className="mt-5 flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, soon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("size-[1.1rem] shrink-0", active && "text-primary")} aria-hidden />
                      <span className="flex-1 truncate">{label}</span>
                      {soon ? (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                          Soon
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <UserMenu email={email} align="start" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName(email)}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
