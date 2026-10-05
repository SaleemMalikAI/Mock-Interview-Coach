"use client";

import { LayoutDashboard, LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayName, initialsOf } from "@/lib/format";

type UserMenuProps = { email: string; align?: "start" | "end" };

export function UserMenu({ email, align = "end" }: UserMenuProps) {
  const router = useRouter();
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={signOutForm} action="/auth/signout" method="post" className="hidden" />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar className="size-9 ring-1 ring-border">
            <AvatarFallback className="bg-brand-subtle text-xs font-semibold text-primary">{initialsOf(displayName(email))}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <span className="block text-xs text-muted-foreground">Signed in as</span>
              <span className="block truncate text-sm font-medium text-foreground">{email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <LayoutDashboard aria-hidden />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/interview/new")}>
            <Plus aria-hidden />
            New interview
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => signOutForm.current?.requestSubmit()}>
            <LogOut aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
