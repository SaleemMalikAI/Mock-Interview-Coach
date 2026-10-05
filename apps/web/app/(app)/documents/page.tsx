import { FileText } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "My documents" };

export default function DocumentsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="My documents"
      description="Upload your resume and cover letter, get them scored against a job description, and get interview questions about your own projects."
      dependsOn="Ships right after answer scoring, which powers the document rubric."
      cta={{ href: "/interview/new", label: "Practice an interview meanwhile" }}
      features={[
        { title: "Resume score", body: "Impact, relevance to the job, clarity and ATS keywords, each with concrete fixes." },
        { title: "Cover letter review", body: "Checks that your letter answers why this company and why you, in under a page." },
        { title: "Questions from your projects", body: "Add 1–2 questions about what you actually built to any interview." },
      ]}
    />
  );
}
