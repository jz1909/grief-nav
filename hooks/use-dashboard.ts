import { MOCK_DASHBOARD_DATA, type DashboardData } from "@/lib/data/dashboard-mock";

/**
 * Returns dashboard data. Currently serves hardcoded mock data synchronously.
 * Swap the body with useQuery({ queryKey: ["dashboard"], queryFn: ... }) later —
 * the return signature already matches TanStack Query, so zero component changes needed.
 */
export function useDashboard(): {
  data: DashboardData | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  return {
    data: MOCK_DASHBOARD_DATA,
    isLoading: false,
    isError: false,
  };
}
