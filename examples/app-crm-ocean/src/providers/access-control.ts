import type { AccessControlProvider, DataProvider } from "@refinedev/core";
import { API_BASE_URL } from "./data";

/**
 * Cache for role data to avoid repeated API calls
 */
let cachedRole: { id: string; name: string; permissions: string[] } | null =
  null;

/**
 * Promise cache to prevent concurrent requests when multiple components
 * check access control simultaneously (e.g., menu items on initial render)
 */
let rolePromise: Promise<{
  id: string;
  name: string;
  permissions: string[];
} | null> | null = null;

/**
 * Clear cached role (call this on logout)
 */
export function clearRoleCache() {
  cachedRole = null;
  rolePromise = null;
  if (import.meta.env.DEV) {
    console.log("[ACCESS CONTROL] Role cache cleared");
  }
}

/**
 * Creates an access control provider that uses the dataProvider for API calls
 * This follows Refine best practices by leveraging the dataProvider infrastructure
 *
 * Following Refine best practices:
 * - Uses role-based access control (RBAC)
 * - Integrates with backend API for role/permission data via dataProvider
 * - Works with CanAccess component and useCan hook
 * - Sider menu items automatically hide based on access control
 */
export const createAccessControlProvider = (
  dataProvider: DataProvider,
): AccessControlProvider => {
  /**
   * Fetch current user's role with permissions from the backend using dataProvider
   * Uses promise caching to prevent concurrent requests
   */
  const getCurrentUserRole = async (): Promise<{
    id: string;
    name: string;
    permissions: string[];
  } | null> => {
    // Return cached data if available
    if (cachedRole) {
      return cachedRole;
    }

    // Return existing promise if request is in progress (prevents race condition)
    if (rolePromise) {
      return rolePromise;
    }

    // Create new request promise and cache it
    if (import.meta.env.DEV) {
      // console.log("[ACCESS CONTROL] Fetching role from API...");
    }

    rolePromise = (async () => {
      try {
        const response = await dataProvider.custom?.<{
          id: string;
          name: string;
          permissions: string[];
        }>({
          url: `${API_BASE_URL}/v1/role/current`,
          method: "get",
          meta: {
            // Ensure this request is cached with a stable query key
            queryKey: ["role", "current"],
          },
        });

        const roleData = response?.data;
        if (roleData) {
          cachedRole = roleData;
          if (import.meta.env.DEV) {
            // console.log("[ACCESS CONTROL] Role loaded and cached:", {
            //   name: cachedRole.name,
            //   permissions: cachedRole.permissions,
            // });
          }
        }
        return cachedRole;
      } catch (error) {
        console.error("[ACCESS CONTROL] Failed to fetch user role:", error);
        return null;
      } finally {
        // Clear promise cache after request completes (success or error)
        rolePromise = null;
      }
    })();

    return rolePromise;
  };

  return {
    can: async ({ resource, action, params }) => {
      if (import.meta.env.DEV) {
        // console.log("[ACCESS CONTROL] Checking:", { resource, action, params });
      }

      try {
        const role = await getCurrentUserRole();

        if (!role) {
          return {
            can: false,
            reason: "User role not found",
          };
        }

        const roleName = role.name.toLowerCase();

        // ============================================
        // ADMIN has access to everything
        // ============================================
        if (roleName === "admin") {
          if (import.meta.env.DEV) {
            // console.log("[ACCESS CONTROL] ✓ Admin has full access");
          }
          return { can: true };
        }

        // ============================================
        // ADMINISTRATION - Admin only
        // ============================================
        if (resource === "administration") {
          const canAccess = roleName === "admin";
          return {
            can: canAccess,
            reason: canAccess
              ? undefined
              : "Only administrators can access this section",
          };
        }

        // ============================================
        // USERS - Admin only (nested under administration)
        // ============================================
        if (resource === "users") {
          const canAccess = roleName === "admin";
          return {
            can: canAccess,
            reason: canAccess
              ? undefined
              : "Only administrators can manage users",
          };
        }

        // ============================================
        // DASHBOARD - Check permissions
        // ============================================
        if (resource === "dashboard") {
          // Check if user has view_dashboard permission or is admin
          const hasPermission =
            roleName === "admin" ||
            role.permissions?.includes("view_dashboard");

          return {
            can: hasPermission,
            reason: hasPermission
              ? undefined
              : "You don't have permission to view the dashboard",
          };
        }

        // ============================================
        // LEADS - Permission-based access
        // ============================================
        if (resource === "lead") {
          switch (action) {
            case "list":
            case "show": {
              // Check for list_leads or list_business permission
              const canList =
                role.permissions?.includes("list_leads") ||
                role.permissions?.includes("list_business");
              return {
                can: canList,
                reason: canList
                  ? undefined
                  : "You don't have permission to view leads",
              };
            }

            case "create": {
              const canCreate = role.permissions?.includes("create_leads");
              return {
                can: canCreate,
                reason: canCreate
                  ? undefined
                  : "You don't have permission to create leads",
              };
            }

            case "edit": {
              const canEdit = role.permissions?.includes("edit_leads");
              return {
                can: canEdit,
                reason: canEdit
                  ? undefined
                  : "You don't have permission to edit leads",
              };
            }

            case "delete": {
              const canDelete = role.permissions?.includes("delete_leads");
              return {
                can: canDelete,
                reason: canDelete
                  ? undefined
                  : "You don't have permission to delete leads",
              };
            }

            default:
              return { can: false };
          }
        }

        // ============================================
        // TASKS - Generally accessible
        // ============================================
        if (resource === "tasks") {
          // Allow all authenticated users to access tasks
          return { can: true };
        }

        // ============================================
        // FACEBOOK - Check permissions
        // ============================================
        if (resource === "facebook") {
          const canAccess =
            roleName === "admin" ||
            role.permissions?.includes("access_facebook");
          return {
            can: canAccess,
            reason: canAccess
              ? undefined
              : "You don't have permission to access Facebook integration",
          };
        }

        // ============================================
        // Default: Deny access
        // ============================================
        if (import.meta.env.DEV) {
          // console.log(
          //   `[ACCESS CONTROL] ✗ No explicit rule for resource: ${resource}, action: ${action}`,
          // );
        }
        return {
          can: false,
          reason: "Access not configured for this resource",
        };
      } catch (error) {
        console.error("[ACCESS CONTROL] Error checking permissions:", error);
        return {
          can: false,
          reason: "Error checking permissions",
        };
      }
    },
    options: {
      buttons: {
        enableAccessControl: true,
        hideIfUnauthorized: false, // Show disabled buttons with reason tooltip
      },
      queryOptions: {
        // Keep data fresh for 5 minutes to prevent redundant API calls
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
      },
    },
  };
};
