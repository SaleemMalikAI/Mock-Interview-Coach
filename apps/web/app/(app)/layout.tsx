import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { TimezoneCookie } from "@/components/timezone-cookie";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect("/login");
  }
  const email = typeof data.claims.email === "string" ? data.claims.email : "";

  return (
    <div className="min-h-dvh">
      <TimezoneCookie />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <AppSidebar email={email} />
      </aside>
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <AppTopbar email={email} />
        <main id="main" className="w-full flex-1 px-4 py-5 sm:px-6 lg:py-6 2xl:mx-auto 2xl:max-w-[1600px]">
          {children}
        </main>
      </div>
    </div>
  );
}
