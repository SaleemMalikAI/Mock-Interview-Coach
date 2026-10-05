import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { safeNextPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

const POINTS = [
  "Questions read aloud, answered by voice",
  "Rubric scores and a stronger sample answer",
  "Pace and filler-word metrics on every answer",
] as const;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-[oklch(0.42_0.2_295)] p-10 text-primary-foreground lg:flex lg:flex-col">
        <div className="bg-dots absolute inset-0 opacity-20" aria-hidden />
        <div className="relative">
          <Logo inverted />
        </div>
        <div className="relative mt-auto max-w-md space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">
            Walk into your next interview having already said it out loud.
          </h2>
          <ul className="space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-primary-foreground/90">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main id="main" className="relative flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to start a mock interview or review your progress.</p>
          </div>
          <div className="mt-8 space-y-4">
            {error ? (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <LoginForm next={next} />
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to practice responsibly. Your recordings are private to your account.
          </p>
        </div>
      </main>
    </div>
  );
}
