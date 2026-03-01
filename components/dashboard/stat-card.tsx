import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  /** Display label above the value. */
  label: string;
  /** Primary metric (number or short string). */
  value: ReactNode;
  /** Optional secondary text below the value. */
  description?: string;
  /** Optional icon rendered to the left of the label. */
  icon?: ReactNode;
  className?: string;
}

/**
 * Generic, project-agnostic KPI tile.
 * Displays a single metric with an optional icon and description.
 */
export function StatCard({
  label,
  value,
  description,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-2 py-4", className)}>
      <CardContent className="flex flex-col gap-1">
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
