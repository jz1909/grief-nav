"use client";

import { cn } from "@/lib/utils";
import type { ChecklistItem } from "@/hooks/use-checklist";

const CATEGORIES = [
  { key: "probate", label: "Probate" },
  { key: "financial", label: "Financial" },
  { key: "government", label: "Government" },
  { key: "insurance", label: "Insurance" },
  { key: "personal", label: "Personal" },
  { key: "legal", label: "Legal" },
] as const;

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  complete: "Complete",
};

interface ChecklistPanelProps {
  items: ChecklistItem[];
  isLoading: boolean;
}

export function ChecklistPanel({ items, isLoading }: ChecklistPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No checklist items yet. Generate a checklist from a deceased profile to
        get started.
      </div>
    );
  }

  const grouped = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  return (
    <div className="space-y-6">
      {CATEGORIES.filter((cat) => grouped.has(cat.key)).map((cat) => (
        <section key={cat.key}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {cat.label}
          </h3>
          <div className="space-y-3">
            {grouped.get(cat.key)!.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{item.title}</p>
                    {item.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        PRIORITY_STYLES[item.priority] ??
                          "bg-gray-100 text-gray-800",
                      )}
                    >
                      {item.priority}
                    </span>
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
