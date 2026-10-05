import {
  ArrowRight,
  AudioLines,
  BarChart3,
  Brain,
  FileText,
  Gauge,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Mic,
    title: "Answer out loud",
    body: "Questions are read to you and you answer by voice, just like a real screen. No typing, no hiding behind a keyboard.",
  },
  {
    icon: Brain,
    title: "Scored like a real interviewer",
    body: "Every answer is graded on accuracy, completeness, clarity, structure and conciseness, with STAR checks for behavioral rounds.",
  },
  {
    icon: Gauge,
    title: "Speech metrics",
    body: "See your pace, filler words and answer length next to the transcript, so you can hear yourself the way an interviewer does.",
  },
  {
    icon: FileText,
    title: "Tailored to the job",
    body: "Paste a job description and get questions about that role's stack and responsibilities, mixed with a curated question bank.",
  },
  {
    icon: BarChart3,
    title: "Track your progress",
    body: "A report after every interview and a trend line across sessions show exactly where you're improving.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your recordings and transcripts are only visible to you. Row-level security protects every table.",
  },
] as const;

const STEPS = [
  { title: "Pick your round", body: "Frontend, full stack, AI engineer or behavioral, at your level." },
  { title: "Answer by voice", body: "Hear the question, think, then record. Re-record if you stumble." },
  { title: "Get feedback", body: "Scores, strengths, fixes and a stronger sample answer in seconds." },
] as const;

const SCORES = [
  { label: "Accuracy", value: 8 },
  { label: "Completeness", value: 7 },
  { label: "Clarity", value: 9 },
  { label: "Structure", value: 6 },
] as const;

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/25 via-primary/5 to-transparent blur-2xl" />
      <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-lift)] sm:p-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Question 2 of 5</span>
          <span className="rounded-full bg-brand-subtle px-2 py-0.5 font-medium text-primary">Full Stack · Senior</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/5 rounded-full bg-primary" />
        </div>
        <p className="mt-5 text-lg font-semibold leading-snug">How would you design multi-tenant data isolation?</p>
        <div className="mt-5 flex items-center gap-4 rounded-xl border bg-muted/40 p-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-recording text-recording-foreground">
            <span className="size-3 rounded-sm bg-current" />
          </span>
          <div className="flex h-8 flex-1 items-center gap-[3px]">
            {[30, 55, 80, 45, 95, 60, 35, 70, 90, 50, 25, 65, 85, 40, 55, 30, 75, 45].map((h, i) => (
              <span key={i} className="w-full rounded-full bg-primary/70" style={{ height: `${h}%` }} />
            ))}
          </div>
          <span className="font-mono text-sm tabular">1:24</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {SCORES.map((s) => (
            <div key={s.label} className="rounded-lg border p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className="font-mono text-sm font-semibold tabular">{s.value}/10</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success" style={{ width: `${s.value * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-subtle p-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-accent-foreground">
            Strong trade-off analysis. Mention row-level security and noisy-neighbor limits to reach a 9.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Sign in
            </Link>
            <Link href="/dashboard" className={cn(buttonVariants(), "hidden sm:inline-flex")}>
              Start practicing
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        <section className="relative overflow-hidden">
          <div className="bg-dots absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-24">
            <div className="space-y-7 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                <AudioLines className="size-3.5 text-primary" aria-hidden />
                Voice-first mock interviews for developers
              </span>
              <h1 className="text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
                Rehearse the interview{" "}
                <span className="bg-gradient-to-r from-primary to-[oklch(0.58_0.2_300)] bg-clip-text text-transparent">
                  before it counts.
                </span>
              </h1>
              <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
                Answer real technical and behavioral questions out loud. Get a transcript, speech metrics and
                rubric-based feedback on every answer in seconds.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/dashboard" className={cn(buttonVariants({ size: "xl" }), "w-full sm:w-auto")}>
                  Start a free interview
                  <ArrowRight data-icon="inline-end" aria-hidden />
                </Link>
                <Link href="#how-it-works" className={cn(buttonVariants({ size: "xl", variant: "outline" }), "w-full sm:w-auto")}>
                  How it works
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">No credit card. Sign in with Google or an email link.</p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section id="how-it-works" className="border-y bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Three steps, five minutes</h2>
            </div>
            <ol className="mt-12 grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative rounded-xl border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <span className="grid size-9 place-items-center rounded-full bg-brand-subtle font-mono text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Feedback you can act on</h2>
            <p className="mt-3 text-muted-foreground">
              Built for the way engineering interviews actually work, from system design to STAR stories.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-card p-6 sm:p-7">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-subtle text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.45_0.2_295)] px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16">
            <div className="bg-dots absolute inset-0 opacity-20" aria-hidden />
            <h2 className="relative text-3xl font-semibold sm:text-4xl">Your next interview starts here</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-primary-foreground/80">
              Run a three-question round now and see your first scores in under ten minutes.
            </p>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: "xl", variant: "secondary" }),
                "relative mt-8 bg-white text-[oklch(0.3_0.1_275)] hover:bg-white/90",
              )}
            >
              Start practicing
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <p>Built with Next.js, FastAPI, Supabase and Groq.</p>
        </div>
      </footer>
    </div>
  );
}
