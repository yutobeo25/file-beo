import { useQuery } from "@tanstack/react-query";

export function useProcessingStatus() {
  return useQuery({
    queryKey: ["/api/processing-jobs"],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });
}
