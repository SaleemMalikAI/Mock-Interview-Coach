import { Route } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Learning journey" };

export default function LearningPage() {
  return (
    <ComingSoon
      icon={Route}
      title="Learning journey"
      description="A personal plan built from your weakest scores: which topics to study, which questions to retry and how you're improving over time."
      dependsOn="Unlocks once your answers are scored, so recommendations come from real results instead of guesses."
      cta={{ href: "/questions", label: "Browse the question bank" }}
      features={[
        { title: "Weak-spot topics", body: "Topics and rubric dimensions where your scores are lowest, ranked by impact." },
        { title: "Retry queue", body: "Questions you scored under 6, ready to practice again in one click." },
        { title: "Skill trend", body: "Accuracy, clarity and structure over time, so you can see what's working." },
      ]}
    />
  );
}
