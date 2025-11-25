import {
  useList,
  useCreate,
  useUpdate,
  useInvalidate,
  useApiUrl,
  useGetIdentity,
} from "@refinedev/core";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/providers/data";
import type {
  Appointment,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
} from "../interfaces/appointment";

/**
 * Custom hook to fetch upcoming appointments for the current user
 * Endpoint: GET /api/v1/appointment?assigned_to={userId}&since={now}
 *
 * @param limit - Optional limit for number of appointments (default: 5)
 * @returns React Query result with upcoming appointments
 */
export const useUpcomingAppointments = (limit = 5) => {
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<{ id: string }>();

  return useQuery<Appointment[]>({
    queryKey: ["appointment", "upcoming", identity?.id, limit],
    queryFn: async () => {
      if (!identity?.id) return [];

      const now = new Date();
      const { data } = await axiosInstance.get(
        `${apiUrl}/appointment?assigned_to=${identity.id}`,
      );

      // Filter only future appointments, sort by nearest first
      const appointments = Array.isArray(data) ? data : [];
      return appointments
        .filter((appointment) => new Date(appointment.scheduled_at) > now)
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        )
        .slice(0, limit);
    },
    enabled: !!identity?.id,
    staleTime: 2 * 60 * 1000, // Keep cache fresh for 2 minutes
    retry: 1,
  });
};

/**
 * Custom hook to fetch all appointments for the current user (including past)
 * Endpoint: GET /api/v1/appointment?assigned_to={userId}
 *
 * @param limit - Optional limit for number of appointments (default: 100)
 * @returns React Query result with all appointments sorted by date
 */
export const useAllAppointments = (limit = 100) => {
  const apiUrl = useApiUrl();
  const { data: identity } = useGetIdentity<{ id: string }>();

  return useQuery<Appointment[]>({
    queryKey: ["appointment", "all", identity?.id, limit],
    queryFn: async () => {
      if (!identity?.id) return [];

      const { data } = await axiosInstance.get(
        `${apiUrl}/appointment?assigned_to=${identity.id}`,
      );

      // Return all appointments sorted by date (newest first)
      const appointments = Array.isArray(data) ? data : [];
      return appointments
        .sort(
          (a, b) =>
            new Date(b.scheduled_at).getTime() -
            new Date(a.scheduled_at).getTime(),
        )
        .slice(0, limit);
    },
    enabled: !!identity?.id,
    staleTime: 2 * 60 * 1000, // Keep cache fresh for 2 minutes
    retry: 1,
  });
};

/**
 * Custom hook to fetch appointments by lead ID using Refine's data hooks
 * Benefits:
 * - Automatic caching and deduplication
 * - Automatic error handling via authProvider.onError
 * - Loading and error states
 * - Automatic cache invalidation on mutations
 */
export const useAppointmentsByLeadId = (leadId: string | undefined) => {
  return useList<Appointment>({
    resource: "appointment",
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
        field: "scheduled_at",
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
 * Custom hook to create an appointment using Refine's data hooks
 * Benefits:
 * - Automatic cache invalidation
 * - Optimistic updates support
 * - Automatic error handling
 */
export const useCreateAppointment = () => {
  const invalidate = useInvalidate();

  return useCreate<Appointment, any, CreateAppointmentPayload>({
    resource: "appointment",
    successNotification: (data) => ({
      message: "Appointment scheduled successfully",
      type: "success",
    }),
    errorNotification: (error) => ({
      message: error?.message || "Failed to schedule appointment",
      type: "error",
    }),
    meta: {
      onSuccess: () => {
        // Invalidate appointment list cache to refetch
        invalidate({
          resource: "appointment",
          invalidates: ["list"],
        });
      },
    },
  });
};

/**
 * Custom hook to update an appointment using Refine's data hooks
 * Benefits:
 * - Automatic cache invalidation
 * - Optimistic updates support
 * - Automatic error handling
 */
export const useUpdateAppointment = () => {
  const invalidate = useInvalidate();

  return useUpdate<Appointment, any, UpdateAppointmentPayload>({
    resource: "appointment",
    successNotification: (data) => ({
      message: "Appointment updated successfully",
      type: "success",
    }),
    errorNotification: (error) => ({
      message: error?.message || "Failed to update appointment",
      type: "error",
    }),
    meta: {
      onSuccess: () => {
        // Invalidate appointment list cache to refetch
        invalidate({
          resource: "appointment",
          invalidates: ["list"],
        });
      },
    },
  });
};
