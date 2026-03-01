"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { PipelineTracker } from "@/components/dashboard/pipeline-tracker";
import { StatsOverview } from "@/components/dashboard/stats-overview";

/**
 * Client boundary for the dashboard page.
 * Fetches data via the useDashboard hook and renders stats + pipeline.
 */
export function DashboardClient() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-destructive">
          Failed to load dashboard data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StatsOverview stats={data.stats} />
      <PipelineTracker steps={data.pipeline} />
    </div>
  );
}
