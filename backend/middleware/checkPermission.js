import { checkUserPermission } from "../controllers/permission.controller.js";

/**
 * Middleware to check if user has permission for specific module and action
 * Admin bypasses all permission checks
 * @param {string} module - The module name (e.g., 'employees', 'finance')
 * @param {string} action - The action name (e.g., 'view', 'create', 'update')
 * @returns {Function} Express middleware function
 */
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      // Admin bypasses all permission checks
      if (req.user.role === "Admin") {
        return next();
      }

      // Check user permission
      const hasPermission = await checkUserPermission(
        req.user._id.toString(),
        module,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Forbidden - You don't have permission to ${action} ${module}`,
        });
      }

      next();
    } catch (error) {
      console.error("Error in checkPermission middleware:", error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
};

