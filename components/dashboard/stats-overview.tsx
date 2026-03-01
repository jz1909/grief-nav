import { Mail, Users, UserCheck, List } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import type { DashboardStats } from "@/lib/data/dashboard-mock";

interface StatsOverviewProps {
  /** Aggregated dashboard statistics. */
  stats: DashboardStats;
}

/**
 * Responsive grid of KPI stat cards showing key metrics at a glance.
 */
export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        label="Emails Imported"
        value={stats.emailsImported.toLocaleString()}
        icon={<Mail className="size-4" />}
      />
      <StatCard
        label="Contacts Found"
        value={stats.contactsFound.toLocaleString()}
        icon={<Users className="size-4" />}
      />
      <StatCard
        label="Classified"
        value={stats.contactsClassified.toLocaleString()}
        description={
          stats.contactsFound > 0
            ? `${Math.round((stats.contactsClassified / stats.contactsFound) * 100)}% of contacts`
            : "No contacts yet"
        }
        icon={<UserCheck className="size-4" />}
      />
      <StatCard
        label="Groups"
        value={
          <ul className="flex flex-col gap-0.5 text-sm font-normal">
            {stats.groups.map((g) => (
              <li key={g.label} className="flex justify-between">
                <span className="text-muted-foreground truncate">
                  {g.label}
                </span>
                <span className="font-medium">{g.count}</span>
              </li>
            ))}
          </ul>
        }
        icon={<List className="size-4" />}
      />
    </div>
  );
}
