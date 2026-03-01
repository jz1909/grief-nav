import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardChatClient } from "@/components/dashboard/dashboard-chat-client";

export const metadata: Metadata = {
  title: "Dashboard — DeathGPT",
  description: "Overview of your mail automation pipeline and contact stats.",
};

/**
 * Server Component entry point for /dashboard.
 * Renders a two-panel split: dashboard content on the left, AI chat on the right.
 */
export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col lg:flex-row">
      {/* Left panel: dashboard content — scrollable */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your progress through the notification pipeline.
            </p>
          </div>
          <DashboardClient />
        </div>
      </main>

      {/* Right panel: AI chat — fixed height, scrolls internally */}
      <aside className="h-[50vh] w-full border-t lg:h-screen lg:w-[440px] lg:min-w-[380px] lg:max-w-[480px] lg:border-t-0 lg:border-l">
        <DashboardChatClient />
      </aside>
    </div>
  );
}
