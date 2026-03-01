import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useImportStats() {
  return useQuery({
    queryKey: ["mail-import-stats"],
    queryFn: async () => {
      const res = await fetch("/api/mail/import");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}

export function useImportEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mail/import", { method: "POST" });
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail-import-stats"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await fetch("/api/mail/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });
}

export function useDossiersForClassification(batchSize = 25) {
  return useQuery({
    queryKey: ["dossiers-classification", batchSize],
    queryFn: async () => {
      const res = await fetch(
        `/api/mail/dossiers?forClassification=true&batchSize=${batchSize}`
      );
      if (!res.ok) throw new Error("Failed to fetch dossiers");
      return res.json();
    },
    enabled: false, // Manual trigger
  });
}

export function useClassificationStatus() {
  return useQuery({
    queryKey: ["classification-status"],
    queryFn: async () => {
      const res = await fetch("/api/mail/classify");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });
}

export function useClassifyContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { categories?: unknown[]; batchSize?: number }) => {
      const res = await fetch("/api/mail/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options || {}),
      });
      if (!res.ok) throw new Error("Classification failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classification-status"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useOverrideClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contactId: string;
      group: string;
      rationale?: string;
    }) => {
      const res = await fetch("/api/mail/classify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Override failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classification-status"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useResetClassifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mail/classify", { method: "DELETE" });
      if (!res.ok) throw new Error("Reset failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classification-status"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// Notification Drafts Hooks

export function useNotificationDrafts() {
  return useQuery({
    queryKey: ["notification-drafts"],
    queryFn: async () => {
      const res = await fetch("/api/mail/notifications");
      if (!res.ok) throw new Error("Failed to fetch drafts");
      return res.json();
    },
  });
}

export function useGenerateNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { deceasedName: string; senderName: string }) => {
      const res = await fetch("/api/mail/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate notifications");
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-drafts"] });
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      draftId: string;
      status?: "draft" | "approved" | "sent" | "skipped";
      subject?: string;
      body?: string;
    }) => {
      const res = await fetch("/api/mail/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update draft");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-drafts"] });
    },
  });
}

export function useSendApprovedNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mail/notifications", { method: "PUT" });
      if (!res.ok) throw new Error("Failed to send notifications");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-drafts"] });
    },
  });
}
