"use client";

import { DashboardChatClient } from "@/src/components/dashboard/dashboard-chat-client";
import { ChecklistPanel } from "@/src/components/dashboard/checklist-panel";
import { useChecklist } from "@/src/hooks/use-checklist";

const TEST_PROFILE_ID = "test-profile-id";

/**
 * Client Component entry point for /dashboard.
 * Renders a two-panel split: dashboard content on the left, AI chat on the right.
 */
export default function DashboardPage() {
  const { items, isLoading } = useChecklist(TEST_PROFILE_ID);

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
          <ChecklistPanel items={items} isLoading={isLoading} />
        </div>
      </main>

      {/* Right panel: AI chat — fixed height, scrolls internally */}
      <aside className="h-[50vh] w-full border-t lg:h-screen lg:w-[440px] lg:min-w-[380px] lg:max-w-[480px] lg:border-t-0 lg:border-l">
        <DashboardChatClient />
      </aside>
    </div>
  );
}
