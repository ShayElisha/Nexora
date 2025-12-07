import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axiosInstance from "../lib/axios";

/**
 * Hook to check if current user has permission for specific module and action
 * @param {string} module - The module name (e.g., 'employees', 'finance')
 * @param {string} action - The action name (e.g., 'view', 'create', 'update', 'delete')
 * @returns {Object} { hasPermission: boolean, isLoading: boolean, error: Error }
 */
export const usePermission = (module, action) => {
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["permission", module, action],
    queryFn: async () => {
      if (!module || !action) {
        return { hasPermission: false };
      }

      try {
        const response = await axiosInstance.get(
          `/permissions/check/${module}/${action}`
        );
        return response.data;
      } catch (error) {
        // If 403 or 401, user doesn't have permission
        if (error.response?.status === 403 || error.response?.status === 401) {
          return { hasPermission: false };
        }
        throw error;
      }
    },
    retry: false,
    enabled: !!module && !!action,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    hasPermission: data?.hasPermission || false,
    isLoading,
    error,
  };
};

/**
 * Hook to get all permissions for current user
 * @returns {Object} { permissions: Object, isLoading: boolean, error: Error }
 */
export const useUserPermissions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["userPermissions"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/permissions/me");
        console.log("📥 [useUserPermissions] Response received:", {
          success: response.data?.success,
          permissions: response.data?.permissions,
          permissionsType: typeof response.data?.permissions,
          permissionsKeys: response.data?.permissions ? Object.keys(response.data.permissions) : [],
        });
        return response.data;
      } catch (error) {
        console.error("❌ [useUserPermissions] Error fetching user permissions:", error);
        // Return empty permissions object if error
        return { permissions: {} };
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const rawPermissions = data?.permissions || {};
  
  // Normalize permissions: convert array format to object format if needed
  const permissions = {};
  Object.keys(rawPermissions).forEach((module) => {
    const modulePerms = rawPermissions[module];
    if (Array.isArray(modulePerms)) {
      // Convert array format ['view', 'create', ...] to object format {view: true, create: true, ...}
      permissions[module] = {};
      modulePerms.forEach((action) => {
        if (action && typeof action === 'string') {
          permissions[module][action] = true;
        }
      });
    } else if (modulePerms && typeof modulePerms === 'object') {
      // Already in object format, use as is
      permissions[module] = modulePerms;
    }
  });
  
  console.log("📤 [useUserPermissions] Returning permissions:", {
    hasPermissions: !!permissions,
    permissionsType: typeof permissions,
    permissionsKeys: Object.keys(permissions),
    permissionsSample: permissions.employees ? {
      employeesType: typeof permissions.employees,
      employeesIsArray: Array.isArray(permissions.employees),
      employees: permissions.employees,
    } : null,
    rawPermissionsSample: rawPermissions.employees ? {
      employeesType: typeof rawPermissions.employees,
      employeesIsArray: Array.isArray(rawPermissions.employees),
      employees: rawPermissions.employees,
    } : null,
  });

  return {
    permissions,
    isLoading,
    error,
  };
};

/**
 * Hook to check multiple permissions at once
 * @param {Array<{module: string, action: string}>} permissionChecks - Array of permission checks
 * @returns {Object} { permissions: Object, isLoading: boolean, allGranted: boolean }
 */
export const useMultiplePermissions = (permissionChecks = []) => {
  const { data, isLoading } = useQuery({
    queryKey: ["multiplePermissions", permissionChecks],
    queryFn: async () => {
      if (!permissionChecks.length) {
        return {};
      }

      const checks = await Promise.all(
        permissionChecks.map(async ({ module, action }) => {
          try {
            const response = await axiosInstance.get(
              `/permissions/check/${module}/${action}`
            );
            return {
              module,
              action,
              hasPermission: response.data.hasPermission,
            };
          } catch (error) {
            return {
              module,
              action,
              hasPermission: false,
            };
          }
        })
      );

      const result = {};
      checks.forEach(({ module, action, hasPermission }) => {
        if (!result[module]) {
          result[module] = {};
        }
        result[module][action] = hasPermission;
      });

      return result;
    },
    retry: false,
    enabled: permissionChecks.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const allGranted = permissionChecks.every(({ module, action }) => {
    return data?.[module]?.[action] === true;
  });

  return {
    permissions: data || {},
    isLoading,
    allGranted,
  };
};

