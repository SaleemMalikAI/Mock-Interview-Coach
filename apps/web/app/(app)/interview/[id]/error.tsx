"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export default function InterviewError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
      <h1 className="text-lg font-semibold">We couldn&apos;t load this interview</h1>
      <p className="mt-2 text-sm text-muted-foreground">The API might be unavailable. Try again in a moment.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Dashboard
        </Link>
        <Button onClick={reset}>
          <RotateCcw data-icon="inline-start" aria-hidden />
          Try again
        </Button>
      </div>
    </div>
  );
}
