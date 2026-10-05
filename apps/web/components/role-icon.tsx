import { Layers, Monitor, Sparkles, Users, type LucideIcon } from "lucide-react";

import type { Role } from "@/lib/interview-options";
import { cn } from "@/lib/utils";

const ICONS: Record<Role, LucideIcon> = {
  frontend: Monitor,
  full_stack: Layers,
  ai_engineer: Sparkles,
  behavioral: Users,
};

export function RoleIcon({ role, className }: { role: Role; className?: string }) {
  const Icon = ICONS[role];
  return <Icon className={cn("size-5", className)} aria-hidden />;
}
