import {
  BookOpenCheck,
  FileText,
  History,
  LayoutDashboard,
  Library,
  Route,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; soon?: boolean };
export type NavSection = { title: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/interviews", label: "Interview history", icon: History },
      { href: "/questions", label: "Question bank", icon: Library },
    ],
  },
  {
    title: "Prepare",
    items: [
      { href: "/stories", label: "STAR stories", icon: BookOpenCheck },
      { href: "/documents", label: "My documents", icon: FileText, soon: true },
      { href: "/learning", label: "Learning journey", icon: Route, soon: true },
    ],
  },
];

const TITLES: [prefix: string, title: string][] = [
  ["/dashboard", "Dashboard"],
  ["/interviews", "Interview history"],
  ["/interview/new", "New interview"],
  ["/interview/", "Interview"],
  ["/questions", "Question bank"],
  ["/stories", "STAR stories"],
  ["/documents", "My documents"],
  ["/learning", "Learning journey"],
];

export function titleFor(pathname: string): string {
  return TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix))?.[1] ?? "Dashboard";
}

export function isActive(pathname: string, href: string): boolean {
  if (href === "/interviews") return pathname === "/interviews" || (pathname.startsWith("/interview/") && pathname !== "/interview/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}
