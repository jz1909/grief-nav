"use client";

import { DashboardChatClient } from "@/src/components/dashboard/dashboard-chat-client";
import { ChecklistPanel } from "@/src/components/dashboard/checklist-panel";
import { useChecklist } from "@/src/hooks/use-checklist";

const TEST_PROFILE_ID = "test-profile-id";

export default function DashboardPage() {
  const { items, isLoading } = useChecklist(TEST_PROFILE_ID);

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 space-y-6 p-6">
        <DashboardChatClient />
        <ChecklistPanel items={items} isLoading={isLoading} />
      </div>
    </div>
  );
}
