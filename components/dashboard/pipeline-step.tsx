import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PipelineStep as PipelineStepType } from "@/lib/data/dashboard-mock";

interface PipelineStepProps {
  /** Step data including label, description, and status. */
  step: PipelineStepType;
  /** Zero-based step index used for the step number indicator. */
  index: number;
  /** When true the vertical connector line below the step is hidden. */
  isLast: boolean;
}

const STATUS_STYLES: Record<
  PipelineStepType["status"],
  { circle: string; badge: string; badgeVariant: "default" | "secondary" | "outline" }
> = {
  completed: {
    circle: "bg-emerald-600 text-white",
    badge: "",
    badgeVariant: "default",
  },
  in_progress: {
    circle: "bg-blue-600 text-white",
    badge: "",
    badgeVariant: "secondary",
  },
  pending: {
    circle: "bg-muted text-muted-foreground",
    badge: "",
    badgeVariant: "outline",
  },
};

const STATUS_LABEL: Record<PipelineStepType["status"], string> = {
  completed: "Done",
  in_progress: "In Progress",
  pending: "Pending",
};

/**
 * A single row in the pipeline tracker.
 * Shows a numbered circle indicator, step label/description, status badge,
 * and a vertical connector line to the next step.
 */
export function PipelineStep({ step, index, isLast }: PipelineStepProps) {
  const style = STATUS_STYLES[step.status];

  return (
    <div className="flex gap-4">
      {/* Left column: circle + connector line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            style.circle
          )}
        >
          {index + 1}
        </div>
        {!isLast && <div className="bg-border w-px flex-1" />}
      </div>

      {/* Right column: content */}
      <div className="flex flex-1 items-start justify-between gap-2 pb-6">
        <div>
          <p className="font-medium leading-8">{step.label}</p>
          <p className="text-muted-foreground text-sm">{step.description}</p>
        </div>
        <Badge variant={style.badgeVariant} className="shrink-0">
          {STATUS_LABEL[step.status]}
        </Badge>
      </div>
    </div>
  );
}
