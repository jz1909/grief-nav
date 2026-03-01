"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChecklistItem {
  id: string;
  deceased_profile_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  document_url: string | null;
  created_at: string;
}

export interface GenerateChecklistInput {
  full_name: string;
  date_of_death: string;
  state: string;
  marital_status: string;
  has_children?: boolean;
  has_property?: boolean;
  has_retirement_accounts?: boolean;
  has_life_insurance?: boolean;
  additional_info?: string;
}

export function useChecklist(deceasedProfileId?: string) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!deceasedProfileId) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/rag/checklist?profile_id=${encodeURIComponent(deceasedProfileId)}`,
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch checklist (${res.status})`);
      }
      const data = await res.json();
      setItems(data.checklist ?? []);
    } catch (error) {
      console.error("Checklist fetch error:", error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [deceasedProfileId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const generateChecklist = useCallback(
    async (profileData: GenerateChecklistInput) => {
      setIsGenerating(true);
      try {
        const res = await fetch("/api/rag/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(
            err?.error ?? `Failed to generate checklist (${res.status})`,
          );
        }

        const data = await res.json();
        setItems(data.checklist ?? []);
        return data;
      } catch (error) {
        console.error("Checklist generation error:", error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return { items, isLoading, isGenerating, generateChecklist, refetch: fetchItems };
}
