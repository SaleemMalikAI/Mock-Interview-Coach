import { Logo } from "@/components/logo";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

type SiteHeaderProps = { email: string };

export function SiteHeader({ email }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Logo href="/dashboard" className="shrink-0" compactOnMobile />
        <div className="ml-auto flex items-center gap-1 sm:ml-6 sm:mr-auto">
          <MainNav />
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
}
