import type { AuthProvider } from "@refinedev/core";

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
export const createAuthProvider = (dataProvider: any): AuthProvider => ({
  login: async ({ email, password }) => {
    try {
      // Step 1: Login and receive cookies or tokens
      const loginResponse = await dataProvider.custom({
        url: `${API_BASE_URL}/v1/auth/login`,
        method: "post",
        payload: {
          email,
          password,
        },
      });

      // Store tokens if using token-based auth
      if (useTokenAuth && loginResponse?.data) {
        const { access_token, refresh_token, access_csrf, refresh_csrf } =
          loginResponse.data;

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

      // Step 2: Fetch organizations (now authenticated with cookies or tokens)
      const orgResponse = await dataProvider.custom({
        url: `${API_BASE_URL}/v1/org/current`,
        method: "get",
      });

      // Step 3: Validate and store organization data
      if (
        !orgResponse?.data ||
        !Array.isArray(orgResponse.data) ||
        orgResponse.data.length === 0
      ) {
        throw new Error("No organizations found for this user");
      }

      // Store organizations and set the first one as current
      setOrgList(orgResponse.data);

      if (import.meta.env.DEV) {
        console.log(
          `[LOGIN] Successfully loaded ${orgResponse.data.length} organization(s)`,
        );
      }

      // Step 4: Only redirect after all setup is complete
      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      // Clear any partial authentication state on failure
      clearOrgData();

      // Clear tokens if using token auth
      if (useTokenAuth) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access_csrf");
        localStorage.removeItem("refresh_csrf");
      }

      return {
        success: false,
        error: {
          message:
            error.response?.data?.detail ||
            error.message ||
            "Login failed. Please check your credentials.",
          name: error.name || "LoginError",
        },
      };
    }
  },
  getPermissions: async () => {
    try {
      // Check if org_id exists before making the request
      const orgId = getOrgId();

      if (!orgId) {
        if (import.meta.env.DEV) {
          console.log("[AUTH] No org_id found, skipping getPermissions");
        }
        return null;
      }

      const response = await dataProvider.custom({
        url: `${API_BASE_URL}/v1/role/current`,
        method: "get",
      });

      const roleData = response?.data;
      if (!roleData) {
        return null;
      }

      if (import.meta.env.DEV) {
        console.log("[AUTH] Permissions loaded:", {
          role: roleData.name,
          permissions: roleData.permissions,
        });
      }

      // Return the permissions array that can be used by access control
      return roleData.permissions || [];
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[AUTH] getPermissions failed:", error);
      }
      return null;
    }
  },
  logout: async () => {
    try {
      await dataProvider.custom({
        url: `${API_BASE_URL}/v1/auth/logout`,
        method: "post",
      });
    } catch (error: any) {
      console.error("[LOGOUT] API call failed:", error);
    } finally {
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
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => {
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
    try {
      // Check if org_id exists before making the request
      const orgId = getOrgId();
      if (!orgId) {
        return null;
      }

      // For token auth, also check if access token exists
      if (useTokenAuth && !localStorage.getItem("access_token")) {
        return null;
      }

      const response = await dataProvider.custom({
        url: `${API_BASE_URL}/v1/user/logged`,
        method: "get",
      });

      const userData = response?.data;
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
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[AUTH] getIdentity failed:", error);
      }
      return error;
    }
  },
});
