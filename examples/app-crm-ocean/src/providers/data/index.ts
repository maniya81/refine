import dataProviderSimpleRest from "@refinedev/simple-rest";
import type { DataProvider } from "@refinedev/core";
import axios, { type AxiosResponse, type AxiosError } from "axios";
import { stringify } from "query-string";
import { from, type Observable } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { getOrgId, clearOrgData } from "@/utilities/organization";
import { AuthErrorMessages } from "../auth";
import { clearRoleCache } from "../access-control";

/**
 * Generic API response structure from backend
 */
interface ApiListResponse<T> {
  items: T[];
  total: number;
  page?: number;
  page_size?: number;
}

/**
 * Alternative API response structure (for backwards compatibility)
 */
interface ApiDataResponse<T> {
  data: T[];
  total: number;
}

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
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<{ detail?: string; message?: string }>) => {
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

    return Promise.reject(error);
  },
);

// Get the base simple-rest data provider
const simpleRestProvider = dataProviderSimpleRest(API_URL, axiosInstance);

// Customize the data provider to use page/page_size instead of _start/_end
export const dataProvider: DataProvider = {
  ...simpleRestProvider,
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
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

    return new Promise((resolve, reject) => {
      from(
        axiosInstance.get<ApiListResponse<unknown> | ApiDataResponse<unknown>>(
          `${url}?${stringify(query, {
            skipNull: true,
            skipEmptyString: true,
            arrayFormat: "none",
          })}`,
        ),
      )
        .pipe(
          map(
            (
              response: AxiosResponse<
                ApiListResponse<unknown> | ApiDataResponse<unknown>
              >,
            ) => {
              const responseData = response.data;
              const data =
                (responseData as ApiListResponse<unknown>).items ||
                (responseData as ApiDataResponse<unknown>).data ||
                responseData;
              return {
                data: data as any,
                total:
                  responseData.total ||
                  ((responseData as ApiListResponse<unknown>).items?.length ??
                    0),
              };
            },
          ),
          catchError((error: AxiosError<{ detail?: string }>) => {
            console.error("[DATA PROVIDER] getList error:", error);
            throw error;
          }),
        )
        .subscribe({
          next: (result) => resolve(result),
          error: (error) => reject(error),
        });
    });
  },

  getOne: async ({ resource, id }) => {
    return new Promise((resolve, reject) => {
      // For resources without a dedicated getOne endpoint, fetch from list and find the item
      // This is a workaround for the backend not having GET /v1/lead/{id} endpoint
      if (resource === "lead") {
        const url = `${API_URL}/${resource}`;

        from(
          axiosInstance.get<
            ApiListResponse<unknown> | ApiDataResponse<unknown>
          >(
            `${url}?${stringify(
              { page: 1, page_size: 1000 },
              { skipNull: true },
            )}`,
          ),
        )
          .pipe(
            map(
              (
                response: AxiosResponse<
                  ApiListResponse<unknown> | ApiDataResponse<unknown>
                >,
              ) => {
                const responseData = response.data;
                const items =
                  (responseData as ApiListResponse<unknown>).items ||
                  (responseData as ApiDataResponse<unknown>).data ||
                  responseData;
                const item = Array.isArray(items)
                  ? items.find(
                      (item: unknown) =>
                        (item as { id: string | number }).id === id,
                    )
                  : null;

                if (!item) {
                  throw new Error(`${resource} with id ${id} not found`);
                }

                return { data: item as any };
              },
            ),
            catchError((error: AxiosError<{ detail?: string }>) => {
              console.error("[DATA PROVIDER] getOne error:", error);
              throw error;
            }),
          )
          .subscribe({
            next: (result) => resolve(result),
            error: (error) => reject(error),
          });
      } else {
        // For other resources, use the default behavior
        const url = `${API_URL}/${resource}/${id}`;

        from(axiosInstance.get<unknown>(url))
          .pipe(
            map((response: AxiosResponse<unknown>) => ({
              data: response.data as any,
            })),
            catchError((error: AxiosError<{ detail?: string }>) => {
              console.error("[DATA PROVIDER] getOne error:", error);
              throw error;
            }),
          )
          .subscribe({
            next: (result) => resolve(result),
            error: (error) => reject(error),
          });
      }
    });
  },

  update: async ({ resource, id, variables }) => {
    const url = `${API_URL}/${resource}/${id}`;

    return new Promise((resolve, reject) => {
      from(axiosInstance.put<unknown>(url, variables))
        .pipe(
          map((response: AxiosResponse<unknown>) => ({
            data: response.data as any,
          })),
          catchError((error: AxiosError<{ detail?: string }>) => {
            console.error("[DATA PROVIDER] update error:", error);
            throw error;
          }),
        )
        .subscribe({
          next: (result) => resolve(result),
          error: (error) => reject(error),
        });
    });
  },
};

export const liveProvider = undefined;
