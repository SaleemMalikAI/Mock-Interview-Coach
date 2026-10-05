import { Skeleton } from "@/components/ui/skeleton";

export default function InterviewLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading interview">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-7 w-56" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
