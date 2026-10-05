"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserMenu } from "@/components/user-menu";
import { titleFor } from "@/lib/navigation";

export function AppTopbar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
          <Menu className="size-5" aria-hidden />
        </Button>
        <Logo href="/dashboard" className="lg:hidden" compactOnMobile />
        <p className="hidden text-sm text-muted-foreground lg:block">
          <span className="text-muted-foreground">Home</span>
          <span className="mx-2 text-border">/</span>
          <span className="font-medium text-foreground">{titleFor(pathname)}</span>
        </p>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <div className="lg:hidden">
            <UserMenu email={email} />
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-72" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar email={email} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
