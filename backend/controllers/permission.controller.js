import Employee from "../models/employees.model.js";

/**
 * Check if user has permission for specific module and action
 * Admin always has all permissions
 * @param {string} userId - User ID
 * @param {string} module - Module name
 * @param {string} action - Action name
 * @returns {boolean} - Whether user has permission
 */
export const checkUserPermission = async (userId, module, action) => {
  try {
    const employee = await Employee.findById(userId).populate("roleId");

    if (!employee) {
      return false;
    }

    // Admin always has all permissions
    if (employee.role === "Admin") {
      return true;
    }

    // Check role permissions
    if (employee.roleId && employee.roleId.permissions) {
      const rolePermission = employee.roleId.permissions.find(
        (p) => p.module === module && p.actions.includes(action)
      );
      if (rolePermission) {
        return true;
      }
    }

    // Check custom permissions (override role permissions)
    if (employee.customPermissions && employee.customPermissions.length > 0) {
      const customPermission = employee.customPermissions.find(
        (p) => p.module === module && p.actions.includes(action)
      );
      if (customPermission) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
};

/**
 * Get all permissions for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const employee = await Employee.findById(userId).populate("roleId");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Admin has all permissions
    if (employee.role === "Admin") {
      const allModules = [
        "products",
        "suppliers",
        "finance",
        "budgets",
        "procurement",
        "projects",
        "employees",
        "signatures",
        "departments",
        "reports",
        "tasks",
        "customers",
        "events",
        "settings",
        "invoices",
        "inventory",
        "analytics",
        "shifts",
        "salary",
        "ai",
      ];
      const allActions = ["view", "create", "update", "delete", "approve", "export"];

      const permissions = {};
      allModules.forEach((module) => {
        permissions[module] = {};
        allActions.forEach((action) => {
          permissions[module][action] = true;
        });
      });

      return res.status(200).json({
        success: true,
        permissions,
      });
    }

    // Build permissions object from role and custom permissions
    const permissions = {};

    console.log("🔐 [getUserPermissions] Employee data:", {
      employeeId: employee._id.toString(),
      role: employee.role,
      roleId: employee.roleId?._id?.toString(),
      hasRoleId: !!employee.roleId,
      rolePermissions: employee.roleId?.permissions,
      rolePermissionsType: typeof employee.roleId?.permissions,
      rolePermissionsIsArray: Array.isArray(employee.roleId?.permissions),
      customPermissions: employee.customPermissions,
    });

    // Add role permissions
    if (employee.roleId && employee.roleId.permissions) {
      console.log("✅ [getUserPermissions] Adding role permissions:", employee.roleId.permissions);
      
      // Check if permissions is array or object
      const permsList = Array.isArray(employee.roleId.permissions) 
        ? employee.roleId.permissions 
        : Object.values(employee.roleId.permissions);
      
      permsList.forEach((perm) => {
        // Perm should be an object with {module: string, actions: string[]}
        if (!perm || typeof perm !== 'object') {
          console.warn("⚠️ [getUserPermissions] Invalid permission format:", perm);
          return;
        }
        
        const module = perm.module;
        const actions = Array.isArray(perm.actions) ? perm.actions : [];
        
        // Skip if no module name
        if (!module || typeof module !== 'string') {
          console.warn("⚠️ [getUserPermissions] Missing or invalid module in permission:", perm);
          return;
        }
        
        if (!permissions[module]) {
          permissions[module] = {};
        }
        
        if (Array.isArray(actions) && actions.length > 0) {
          actions.forEach((action) => {
            if (action && typeof action === 'string') {
              permissions[module][action] = true;
            }
          });
        }
      });
    } else {
      console.log("⚠️ [getUserPermissions] No roleId or role permissions found");
    }

    // Merge custom permissions (override role permissions)
    if (employee.customPermissions && employee.customPermissions.length > 0) {
      console.log("✅ [getUserPermissions] Adding custom permissions:", employee.customPermissions);
      employee.customPermissions.forEach((perm) => {
        const module = perm.module;
        const actions = Array.isArray(perm.actions) ? perm.actions : [];
        
        if (!module) return;
        
        if (!permissions[module]) {
          permissions[module] = {};
        }
        
        actions.forEach((action) => {
          if (action) {
            permissions[module][action] = true;
          }
        });
      });
    }

    console.log("📤 [getUserPermissions] Final permissions object:", JSON.stringify(permissions, null, 2));

    res.status(200).json({
      success: true,
      permissions,
    });
  } catch (error) {
    console.error("Error getting user permissions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Check permission endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkPermission = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not authenticated",
      });
    }

    const { module, action } = req.params;

    const hasPermission = await checkUserPermission(
      req.user._id.toString(),
      module,
      action
    );

    res.status(200).json({
      success: true,
      hasPermission,
    });
  } catch (error) {
    console.error("Error checking permission:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get all available permissions (modules and actions)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllAvailablePermissions = async (req, res) => {
  try {
    const modules = [
      "products",
      "suppliers",
      "finance",
      "budgets",
      "procurement",
      "projects",
      "employees",
      "signatures",
      "departments",
      "reports",
      "tasks",
      "customers",
      "events",
      "settings",
      "invoices",
      "inventory",
      "analytics",
      "shifts",
      "salary",
      "ai",
    ];

    const actions = ["view", "create", "update", "delete", "approve", "export"];

    res.status(200).json({
      success: true,
      modules,
      actions,
    });
  } catch (error) {
    console.error("Error getting available permissions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

