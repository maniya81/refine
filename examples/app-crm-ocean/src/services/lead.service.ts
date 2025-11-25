import {
  useList,
  useCreate,
  useUpdate,
  useInvalidate,
  useApiUrl,
} from "@refinedev/core";
import type { CrudFilters, CrudSorting, Pagination } from "@refinedev/core";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/providers/data";

// Re-export Lead types from interfaces
export type {
  Lead,
  CreateLeadPayload,
  UpdateLeadPayload,
  LeadStage,
} from "@/interfaces/lead";
export {
  LEAD_STAGE_OPTIONS,
  LEAD_STAGE_ORDER,
  LEAD_STAGE_COLORS,
  LEAD_STAGE_LABELS,
} from "@/interfaces/lead";

import type {
  Lead,
  CreateLeadPayload,
  UpdateLeadPayload,
} from "@/interfaces/lead";

/**
 * Custom hook to fetch all leads with optional filters, sorting, and pagination
 * Benefits:
 * - Automatic caching and deduplication
 * - Automatic error handling via authProvider.onError
 * - Loading and error states
 * - Supports filters, sorting, and pagination
 */
export const useLeads = (options?: {
  filters?: CrudFilters;
  sorters?: CrudSorting;
  pagination?: Pagination;
  queryOptions?: {
    enabled?: boolean;
    staleTime?: number;
  };
}) => {
  return useList<Lead>({
    resource: "lead",
    filters: options?.filters,
    sorters: options?.sorters || [
      {
        field: "since",
        order: "desc",
      },
    ],
    pagination: options?.pagination,
    queryOptions: {
      staleTime: options?.queryOptions?.staleTime ?? 30 * 1000, // 30 seconds default
      enabled: options?.queryOptions?.enabled ?? true,
    },
  });
};

/**
 * Custom hook to fetch leads by stage
 * Useful for Kanban boards or filtered views
 */
export const useLeadsByStage = (stage: string | undefined) => {
  return useList<Lead>({
    resource: "lead",
    filters: stage
      ? [
          {
            field: "stage",
            operator: "eq",
            value: stage,
          },
        ]
      : undefined,
    sorters: [
      {
        field: "since",
        order: "desc",
      },
    ],
    queryOptions: {
      enabled: !!stage,
      staleTime: 30 * 1000,
    },
  });
};

/**
 * Custom hook to fetch leads by assigned user
 * Useful for user-specific lead views
 */
export const useLeadsByAssignedUser = (userId: string | undefined) => {
  return useList<Lead>({
    resource: "lead",
    filters: userId
      ? [
          {
            field: "assigned_user.id",
            operator: "eq",
            value: userId,
          },
        ]
      : undefined,
    sorters: [
      {
        field: "since",
        order: "desc",
      },
    ],
    queryOptions: {
      enabled: !!userId,
      staleTime: 30 * 1000,
    },
  });
};

/**
 * Custom hook to create a lead using Refine's data hooks
 * Benefits:
 * - Automatic cache invalidation
 * - Optimistic updates support
 * - Automatic error handling
 * - Success/error notifications
 */
export const useCreateLead = () => {
  const invalidate = useInvalidate();

  return useCreate<Lead, any, CreateLeadPayload>({
    resource: "lead",
    successNotification: (data) => ({
      message: "Lead created successfully",
      type: "success",
      description: `Lead for ${
        data?.data?.business?.business || "business"
      } has been created`,
    }),
    errorNotification: (error) => ({
      message: error?.message || "Failed to create lead",
      type: "error",
      description: "Please check the form and try again",
    }),
    meta: {
      onSuccess: () => {
        // Invalidate lead list cache to refetch
        invalidate({
          resource: "lead",
          invalidates: ["list"],
        });
      },
    },
  });
};

/**
 * Custom hook to update a lead using Refine's data hooks
 * Benefits:
 * - Automatic cache invalidation
 * - Optimistic updates support
 * - Automatic error handling
 * - Success/error notifications
 */
export const useUpdateLead = () => {
  const invalidate = useInvalidate();

  return useUpdate<Lead, any, UpdateLeadPayload>({
    resource: "lead",
    mutationMode: "optimistic", // UI updates instantly
    successNotification: (data) => ({
      message: "Lead updated successfully",
      type: "success",
    }),
    errorNotification: (error) => ({
      message: error?.message || "Failed to update lead",
      type: "error",
    }),
    meta: {
      onSuccess: () => {
        // Invalidate lead list cache to refetch
        invalidate({
          resource: "lead",
          invalidates: ["list", "detail"],
        });
      },
    },
  });
};

/**
 * Custom hook to search leads by multiple fields
 * Supports searching by business name, email, mobile
 */
export const useSearchLeads = (searchTerm: string | undefined) => {
  return useList<Lead>({
    resource: "lead",
    filters: searchTerm
      ? [
          {
            operator: "or",
            value: [
              {
                field: "business.business",
                operator: "contains",
                value: searchTerm,
              },
              {
                field: "business.email",
                operator: "contains",
                value: searchTerm,
              },
              {
                field: "business.mobile",
                operator: "contains",
                value: searchTerm,
              },
            ],
          },
        ]
      : undefined,
    pagination: {
      pageSize: 50,
      mode: "server",
    },
    queryOptions: {
      enabled: !!searchTerm && searchTerm.length > 2,
      staleTime: 15 * 1000, // 15 seconds for search results
    },
  });
};

export interface LeadCountResponse {
  total_count: number;
  count_by_month: {
    month: string;
    count: number;
  }[];
}

interface LeadCountQueryParams {
  stage?: string;
  excludeStages?: string[]; // Matches List[StageEnum] in FastAPI
  since?: string; // ISO datetime string
  until?: string; // ISO datetime string
}

/**
 * Custom hook to fetch lead count from the API
 * Endpoint: GET /api/v1/lead/count
 *
 * @param stage - Optional stage filter (e.g., "WON", "LOST"). Cannot be used together with `excludeStages`.
 * @param excludeStages - Optional array of stages to exclude from the count.
 * @param since - Optional ISO datetime string to filter leads created after this date.
 * @param until - Optional ISO datetime string to filter leads created before this date.
 * @returns React Query result with lead count data
 *
 * @example
 * ```tsx
 * // Get total leads
 * const { data: totalLeads } = useLeadCount();
 *
 * // Get leads in WON stage
 * const { data: wonLeads } = useLeadCount({ stage: "WON" });
 *
 * // Get leads excluding LOST and CANCELLED stages
 * const { data: activeLeads } = useLeadCount({ excludeStages: ["LOST", "CANCELLED"] });
 *
 * // Get leads since a specific date
 * const { data: recentLeads } = useLeadCount({ since: new Date().toISOString() });
 *
 * // Get leads in WON stage until a specific date
 * const { data: wonLeadsUntil } = useLeadCount({ stage: "WON", until: new Date().toISOString() });
 * ```
 */

export const useLeadCount = ({
  stage,
  excludeStages,
  since,
  until,
}: LeadCountQueryParams = {}) => {
  const apiUrl = useApiUrl();

  return useQuery<LeadCountResponse>({
    queryKey: ["lead", "count", stage, excludeStages, since, until],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (stage) params.append("stage", stage);
      if (excludeStages && excludeStages.length > 0) {
        excludeStages.forEach((s) => params.append("exclude_stages", s));
      }
      if (since) params.append("since", since);
      if (until) params.append("until", until);

      const url = `${apiUrl}/lead/count?${params.toString()}`;
      const { data } = await axiosInstance.get(url);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Keep cache fresh for 5 minutes
    retry: 1, // Retry once on failure
  });
};

export interface LeadPotentialResponse {
  won: {
    month: string;
    potential: number;
  }[];
  lost: {
    month: string;
    potential: number;
  }[];
}

/**
 * Custom hook to fetch lead potential (won/lost amounts) from the API
 * Endpoint: GET /api/v1/lead/potential
 *
 * @returns React Query result with lead potential data for won and lost leads
 *
 * @example
 * ```tsx
 * const { data: potential, isLoading } = useLeadPotential();
 * const wonData = potential?.won || [];
 * const lostData = potential?.lost || [];
 * ```
 */
export const useLeadPotential = () => {
  const apiUrl = useApiUrl();

  return useQuery<LeadPotentialResponse>({
    queryKey: ["lead", "potential"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${apiUrl}/lead/potential`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Keep cache fresh for 5 minutes
    retry: 1, // Retry once on failure
  });
};
