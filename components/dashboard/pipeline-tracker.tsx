"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PipelineStep } from "@/components/dashboard/pipeline-step";
import type { PipelineStep as PipelineStepType } from "@/lib/data/dashboard-mock";

interface PipelineTrackerProps {
  /** Ordered list of pipeline steps. */
  steps: PipelineStepType[];
}

/**
 * Card showing the full pipeline with a progress bar and individual step rows.
 */
export function PipelineTracker({ steps }: PipelineTrackerProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Status</CardTitle>
        <CardDescription>
          {completedCount} of {steps.length} steps complete
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <Progress value={percentage} />

        <div>
          {steps.map((step, i) => (
            <PipelineStep
              key={step.id}
              step={step}
              index={i}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
