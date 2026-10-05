import type { Metadata } from "next";

import { InterviewSetupForm } from "@/components/interview-setup-form";

export const metadata: Metadata = { title: "New interview · Mock Interview Coach" };

export default function NewInterviewPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Set up your interview</h1>
        <p className="text-sm text-muted-foreground">
          Pick a role and level. You&apos;ll answer each question out loud and get feedback after every answer.
        </p>
      </div>
      <InterviewSetupForm />
    </main>
  );
}
