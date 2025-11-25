import type { AuthProvider, DataProvider } from "@refinedev/core";
import { from, of, throwError, type Observable } from "rxjs";
import { switchMap, map, catchError, tap } from "rxjs/operators";
import type { AxiosError } from "axios";

import { API_BASE_URL, axiosInstance } from "./data";
import { setOrgList, clearOrgData, getOrgId } from "@/utilities/organization";
import { clearRoleCache } from "./access-control";

/**
 * Authentication error messages enum
 */
export enum AuthErrorMessages {
  MISSING_TOKEN = "Missing token in request.",
  INVALID_TOKEN = "Invalid or expired token.",
  SESSION_EXPIRED = "Your session has expired. Please login again.",
}

/**
 * Login response structure from backend
 */
interface LoginResponse {
  data: {
    access_token?: string;
    refresh_token?: string;
    access_csrf?: string;
    refresh_csrf?: string;
  };
}

/**
 * Organization data structure
 */
interface Organization {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Organization response from backend
 */
interface OrganizationResponse {
  data: Organization[];
}

/**
 * Role/Permission response from backend
 */
interface RoleResponse {
  data: {
    name: string;
    permissions: string[];
  } | null;
}

/**
 * Auth error response from backend
 */
interface AuthErrorResponse {
  detail?: string;
  message?: string;
}

/**
 * For demo purposes and to make it easier to test the app, you can use the following credentials:
 */
export const authCredentials = {
  email: "",
  password: "",
};

const useTokenAuth = import.meta.env.VITE_AUTH_METHOD === "token";

/**
 * Creates an auth provider that uses the dataProvider for API calls
 * This follows Refine best practices by leveraging the dataProvider infrastructure
 */
export const createAuthProvider = (
  dataProvider: DataProvider,
): AuthProvider => {
  if (!dataProvider.custom) {
    throw new Error(
      "DataProvider must implement the 'custom' method for authentication",
    );
  }

  return {
    login: async ({ email, password }: { email: string; password: string }) => {
      return new Promise((resolve) => {
        from(
          dataProvider.custom!({
            url: `${API_BASE_URL}/v1/auth/login`,
            method: "post",
            payload: {
              email,
              password,
            },
          }),
        )
          .pipe(
            // Step 1: Store tokens if login successful
            tap((loginResponse: unknown) => {
              const response = loginResponse as LoginResponse;
              // Store tokens if using token-based auth
              if (useTokenAuth && response?.data) {
                const {
                  access_token,
                  refresh_token,
                  access_csrf,
                  refresh_csrf,
                } = response.data;

                if (access_token) {
                  localStorage.setItem("access_token", access_token);
                }
                if (refresh_token) {
                  localStorage.setItem("refresh_token", refresh_token);
                }
                if (access_csrf) {
                  localStorage.setItem("access_csrf", access_csrf);
                }
                if (refresh_csrf) {
                  localStorage.setItem("refresh_csrf", refresh_csrf);
                }
              }
            }),
            // Step 2: Fetch organizations
            switchMap(() =>
              from(
                dataProvider.custom!({
                  url: `${API_BASE_URL}/v1/org/current`,
                  method: "get",
                }),
              ),
            ),
            // Step 3: Validate and store organization data
            map((orgResponse: unknown) => {
              const response = orgResponse as OrganizationResponse;
              if (
                !response?.data ||
                !Array.isArray(response.data) ||
                response.data.length === 0
              ) {
                throw new Error("No organizations found for this user");
              }

              // Store organizations and set the first one as current
              setOrgList(response.data);

              if (import.meta.env.DEV) {
                console.log(
                  `[LOGIN] Successfully loaded ${response.data.length} organization(s)`,
                );
              }

              return {
                success: true,
                redirectTo: "/",
              };
            }),
            // Step 4: Handle errors
            catchError((error: AxiosError<AuthErrorResponse>) => {
              // Clear any partial authentication state on failure
              clearOrgData();

              // Determine error message
              const errorMessage =
                error.response?.data?.detail ||
                error.message ||
                "Login failed. Please check your credentials.";

              // Clear tokens if using token auth
              if (useTokenAuth) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("access_csrf");
                localStorage.removeItem("refresh_csrf");
              }

              return of({
                success: false,
                error: {
                  message: errorMessage,
                  name: "Error",
                },
              });
            }),
          )
          .subscribe({
            next: (result) => resolve(result),
            error: (error: Error) =>
              resolve({
                success: false,
                error: {
                  message: error.message || "Unexpected error occurred",
                  name: "Authentication Error",
                },
              }),
          });
      });
    },
    getPermissions: async (): Promise<string[] | null> => {
      const orgId = getOrgId();

      if (!orgId) {
        if (import.meta.env.DEV) {
          console.log("[AUTH] No org_id found, skipping getPermissions");
        }
        return null;
      }

      return new Promise((resolve) => {
        from(
          dataProvider.custom!({
            url: `${API_BASE_URL}/v1/role/current`,
            method: "get",
          }),
        )
          .pipe(
            map((response: unknown) => {
              const roleResponse = response as RoleResponse;
              const roleData = roleResponse?.data;
              if (!roleData) {
                return null;
              }

              if (import.meta.env.DEV) {
                console.log("[AUTH] Permissions loaded:", {
                  role: roleData.name,
                  permissions: roleData.permissions,
                });
              }

              return roleData.permissions || [];
            }),
            catchError((error: AxiosError<AuthErrorResponse>) => {
              if (import.meta.env.DEV) {
                console.error("[AUTH] getPermissions failed:", error);
              }
              return of(null);
            }),
          )
          .subscribe({
            next: (result) => resolve(result),
            error: () => resolve(null),
          });
      });
    },
    logout: async () => {
      return new Promise((resolve) => {
        from(
          dataProvider.custom!({
            url: `${API_BASE_URL}/v1/auth/logout`,
            method: "post",
          }),
        )
          .pipe(
            catchError((error: AxiosError<AuthErrorResponse>) => {
              console.error("[LOGOUT] API call failed:", error);
              return of(null);
            }),
            tap(() => {
              // Clear cached role and organization data on logout
              clearRoleCache();
              clearOrgData();

              // Clear tokens if using token auth
              if (useTokenAuth) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("access_csrf");
                localStorage.removeItem("refresh_csrf");
              }
            }),
            map(() => ({
              success: true,
              redirectTo: "/login",
            })),
          )
          .subscribe({
            next: (result) => resolve(result),
            error: () =>
              resolve({
                success: true,
                redirectTo: "/login",
              }),
          });
      });
    },
    onError: async (error: AxiosError<AuthErrorResponse>) => {
      if (error.status === 401 || error.status === 422) {
        return {
          logout: true,
          error: {
            message: AuthErrorMessages.SESSION_EXPIRED,
            name: "Authentication Error",
          },
        };
      }

      // For all other errors, just return the error without logging out
      return { error };
    },
    check: async () => {
      try {
        // Check if org_id exists using centralized utility
        const orgId = getOrgId();

        if (!orgId) {
          return {
            authenticated: false,
            redirectTo: "/login",
          };
        }

        // Check authentication based on auth method
        if (useTokenAuth) {
          // For token auth, check if access_token exists in localStorage
          const hasAccessToken = !!localStorage.getItem("access_token");

          if (!hasAccessToken) {
            return {
              error: {
                message: AuthErrorMessages.SESSION_EXPIRED,
                name: "Authentication Error",
              },
              authenticated: false,
              redirectTo: "/login",
            };
          }
        } else {
          // For cookie auth, check if csrf_access_token exists
          const hasCsrfAccessToken =
            document.cookie.includes("csrf_access_token=");

          if (!hasCsrfAccessToken) {
            return {
              error: {
                message: AuthErrorMessages.SESSION_EXPIRED,
                name: "Authentication Error",
              },
              authenticated: false,
              redirectTo: "/login",
            };
          }
        }

        // User appears to be authenticated
        // If session expired, onError will catch 401/422 and logout automatically
        return {
          authenticated: true,
        };
      } catch (error) {
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }
    },
    getIdentity: async () => {
      const orgId = getOrgId();
      if (!orgId) {
        return null;
      }

      // For token auth, also check if access token exists
      if (useTokenAuth && !localStorage.getItem("access_token")) {
        return null;
      }

      interface UserIdentity {
        id: string;
        name: string;
        email: string;
        mobile?: string;
        avatarUrl?: string;
      }

      interface UserResponse {
        data: {
          id: string;
          name?: string;
          email: string;
          mobile?: string;
          avatar_url?: string;
        };
      }

      return new Promise<UserIdentity | null>((resolve, reject) => {
        from(
          dataProvider.custom!({
            url: `${API_BASE_URL}/v1/user/logged`,
            method: "get",
          }),
        )
          .pipe(
            map((response: unknown) => {
              const userResponse = response as UserResponse;
              const userData = userResponse?.data;
              if (!userData) {
                return null;
              }

              // Map FastAPI user response to expected format
              return {
                id: userData.id,
                name: userData.name || userData.email,
                email: userData.email,
                mobile: userData.mobile,
                avatarUrl: userData.avatar_url,
              };
            }),
            catchError((error: AxiosError<AuthErrorResponse>) => {
              if (import.meta.env.DEV) {
                console.error("[AUTH] getIdentity failed:", error);
              }
              return throwError(() => error);
            }),
          )
          .subscribe({
            next: (result) => resolve(result),
            error: (error) => reject(error),
          });
      });
    },
  };
};
