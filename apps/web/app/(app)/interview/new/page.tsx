import type { Metadata } from "next";

import { InterviewSetupForm } from "@/components/interview-setup-form";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "New interview" };

export default function NewInterviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="New interview"
        title="Set up your round"
        description="Choose a track and level. You'll hear each question, answer out loud and get feedback after every answer."
      />
      <InterviewSetupForm />
    </div>
  );
}
