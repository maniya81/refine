import {
  useList,
  useCreate,
  useInvalidate,
  useApiUrl,
  useGetIdentity,
} from "@refinedev/core";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/providers/data";
import type {
  Interaction,
  CreateInteractionPayload,
} from "../interfaces/interaction";

/**
 * Custom hook to fetch latest interactions for the current user
 * Endpoint: GET /api/v1/interaction?interacted_by={userId}
 *
 * @param limit - Optional limit for number of interactions (default: 5)
 * @returns React Query result with latest interactions
 */
export const useLatestInteractions = (limit = 5) => {
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<{ id: string }>();

  return useQuery<Interaction[]>({
    queryKey: ["interaction", "latest", identity?.id, limit],
    queryFn: async () => {
      if (!identity?.id) return [];

      const { data } = await axiosInstance.get(
        `${apiUrl}/interaction?interacted_by=${identity.id}`,
      );

      // Return only the first 'limit' interactions, sorted by interacted_at (descending)
      const interactions = Array.isArray(data) ? data : [];
      return interactions
        .sort(
          (a, b) =>
            new Date(b.interacted_at).getTime() -
            new Date(a.interacted_at).getTime(),
        )
        .slice(0, limit);
    },
    enabled: !!identity?.id,
    staleTime: 2 * 60 * 1000, // Keep cache fresh for 2 minutes
    retry: 1,
  });
};

/**
 * Custom hook to fetch interactions by lead ID using Refine's data hooks
 * Benefits:
 * - Automatic caching and deduplication
 * - Automatic error handling via authProvider.onError
 * - Loading and error states
 * - Automatic cache invalidation on mutations
 */
export const useInteractionsByLeadId = (leadId: string | undefined) => {
  return useList<Interaction>({
    resource: "interaction",
    filters: leadId
      ? [
          {
            field: "lead_id",
            operator: "eq",
            value: leadId,
          },
        ]
      : undefined,
    sorters: [
      {
        field: "interacted_at",
        order: "desc",
      },
    ],
    queryOptions: {
      enabled: !!leadId, // Only fetch if leadId is provided
      staleTime: 30 * 1000, // Keep cache fresh for 30 seconds
    },
  });
};

/**
 * Custom hook to create an interaction using Refine's data hooks
 * Benefits:
 * - Automatic cache invalidation
 * - Optimistic updates support
 * - Automatic error handling
 */
export const useCreateInteraction = () => {
  const invalidate = useInvalidate();

  return useCreate<Interaction, any, CreateInteractionPayload>({
    resource: "interaction",
    successNotification: (data) => ({
      message: "Activity logged successfully",
      type: "success",
    }),
    errorNotification: (error) => ({
      message: error?.message || "Failed to log activity",
      type: "error",
    }),
    meta: {
      onSuccess: () => {
        // Invalidate interaction list cache to refetch
        invalidate({
          resource: "interaction",
          invalidates: ["list"],
        });
      },
    },
  });
};
