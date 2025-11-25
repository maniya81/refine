import dataProviderSimpleRest from "@refinedev/simple-rest";
import type { DataProvider } from "@refinedev/core";
import axios from "axios";
import { stringify } from "query-string";
import { getOrgId, clearOrgData } from "@/utilities/organization";
import { AuthErrorMessages } from "../auth";
import { clearRoleCache } from "../access-control";

// Use environment variable for API URL, fallback to localhost for development
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_URL = `${API_BASE_URL}/v1`;

// Check if we should use token-based auth (for staging/development)
const useTokenAuth = import.meta.env.VITE_AUTH_METHOD === "token";

// Create axios instance with credentials included for cookie-based auth
export const axiosInstance = axios.create({
  withCredentials: !useTokenAuth, // Include cookies only for cookie-based auth
});

// Add request interceptor to include org-id header and authentication tokens
axiosInstance.interceptors.request.use(
  (config) => {
    // Add x-org-id header using centralized organization utility
    const orgId = getOrgId();
    if (orgId) {
      config.headers["x-org-id"] = orgId;
    }

    // Add token-based authentication headers if using token auth
    if (useTokenAuth) {
      const accessToken = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");

      if (accessToken) {
        config.headers["x-access-token"] = accessToken;
        if (import.meta.env.DEV) {
          console.log("[API REQUEST] Added x-access-token header");
        }
      } else if (import.meta.env.DEV) {
        console.warn("[API REQUEST] No access token found in localStorage");
      }

      if (refreshToken) {
        config.headers["x-refresh-token"] = refreshToken;
      } else if (import.meta.env.DEV) {
        console.warn("[API REQUEST] No refresh token found in localStorage");
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      clearOrgData();
      clearRoleCache();
      window.location.href = "/login";
    } else if (
      status === 422 &&
      error.response?.data?.message === AuthErrorMessages.SESSION_EXPIRED
    ) {
      clearOrgData();
      clearRoleCache();
      window.location.href = "/login";
    }

    return error;
  },
);

// Get the base simple-rest data provider
const simpleRestProvider = dataProviderSimpleRest(API_URL, axiosInstance);

// Customize the data provider to use page/page_size instead of _start/_end
export const dataProvider: DataProvider = {
  ...simpleRestProvider,
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    try {
      // Remove trailing slash to avoid 307 redirects from FastAPI
      const url = `${API_URL}/${resource}`;

      // Handle pagination - Refine uses currentPage/pageSize (not current/pageSize)
      const currentPage =
        (pagination as any)?.currentPage ?? (pagination as any)?.current ?? 1;
      const pageSize = (pagination as any)?.pageSize ?? 10;
      const mode = (pagination as any)?.mode ?? "server";

      const query: {
        page?: number;
        page_size?: number;
        q?: string;
        assigned_user_ids?: string[];
        lead_id?: string;
        business_id?: string;
      } = {};

      if (mode === "server") {
        query.page = currentPage;
        query.page_size = pageSize;
      }

      // Handle filters
      if (filters) {
        filters.forEach((filter) => {
          if ("field" in filter && filter.value) {
            // Handle search filter (q parameter)
            if (filter.field === "q") {
              query.q = filter.value;
            }
            // Handle assigned_user filter - send as array for multiple query params
            else if (
              filter.field === "assigned_user" ||
              filter.field === "assigned_user.id"
            ) {
              // Always convert to array for consistent query param handling
              if (Array.isArray(filter.value)) {
                query.assigned_user_ids = filter.value;
              } else {
                query.assigned_user_ids = [filter.value];
              }
            }
            // Handle lead_id filter for interactions and appointments
            else if (filter.field === "lead_id") {
              query.lead_id = filter.value;
            }
            // Handle business_id filter for contacts
            else if (filter.field === "business_id") {
              query.business_id = filter.value;
            }
          }
        });
      }

      const { data } = await axiosInstance.get(
        `${url}?${stringify(query, {
          skipNull: true,
          skipEmptyString: true,
          arrayFormat: "none",
        })}`,
      );

      return {
        data: data.items || data.data || data,
        total: data.total || data.items?.length || 0,
      };
    } catch (error: any) {
      // Ensure error is properly formatted for Refine's error handling
      // Log the error so we can see it's being caught
      console.error("[DATA PROVIDER] getList error:", error);

      // Re-throw the error so Refine's useTable/useList can catch it
      // and pass it to authProvider.onError via internal useOnError hook
      throw error;
    }
  },

  getOne: async ({ resource, id }) => {
    try {
      // For resources without a dedicated getOne endpoint, fetch from list and find the item
      // This is a workaround for the backend not having GET /v1/lead/{id} endpoint
      if (resource === "lead") {
        // Remove trailing slash to avoid 307 redirects from FastAPI
        const url = `${API_URL}/${resource}`;

        // Fetch with a large page size to increase chances of finding the lead
        // In production, this should be replaced with a proper backend endpoint
        const { data } = await axiosInstance.get(
          `${url}?${stringify(
            { page: 1, page_size: 1000 },
            { skipNull: true },
          )}`,
        );

        const items = data.items || data.data || data;
        const item = items.find((item: any) => item.id === id);

        if (!item) {
          throw new Error(`${resource} with id ${id} not found`);
        }

        return { data: item };
      }

      // For other resources, use the default behavior
      const url = `${API_URL}/${resource}/${id}`;
      const { data } = await axiosInstance.get(url);
      return { data };
    } catch (error: any) {
      console.error("[DATA PROVIDER] getOne error:", error);
      throw error;
    }
  },

  update: async ({ resource, id, variables }) => {
    try {
      const url = `${API_URL}/${resource}/${id}`;
      const { data } = await axiosInstance.put(url, variables);
      return { data };
    } catch (error: any) {
      console.error("[DATA PROVIDER] update error:", error);
      throw error;
    }
  },
};

export const liveProvider = undefined;
