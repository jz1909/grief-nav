import { useMutation } from "@tanstack/react-query";
import type { CoordinatorResponse } from "@/types/coordinator";

export function useCoordinator() {
  return useMutation({
    mutationFn: async (input: string): Promise<CoordinatorResponse> => {
      const res = await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Request failed");
      }
      return res.json();
    },
  });
}
