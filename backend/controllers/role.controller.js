import mongoose from "mongoose";
import Role from "../models/Role.model.js";
import Employee from "../models/employees.model.js";

/**
 * Get all default roles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDefaultRoles = async (req, res) => {
  try {
    const defaultRoles = await Role.find({ isDefault: true });

    res.status(200).json({
      success: true,
      roles: defaultRoles,
    });
  } catch (error) {
    console.error("Error getting default roles:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get all roles for a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllRoles = async (req, res) => {
  try {
    // Check both companyId and company fields (Employee model might use either)
    const companyId = req.user?.companyId || req.user?.company;
    const userRole = req.user?.role;
    const userId = req.user?._id;

    console.log("🔍 getAllRoles - Request received:", {
      userId: userId?.toString(),
      companyId: companyId?.toString(),
      companyIdFromUser: req.user?.companyId?.toString(),
      companyFromUser: req.user?.company?.toString(),
      userRole,
      hasUser: !!req.user,
      userKeys: req.user ? Object.keys(req.user) : [],
      queryParams: req.query,
    });

    // Build query
    let query = {};
    
    // Build query - ALWAYS filter by companyId if available
    if (companyId) {
      // Convert to ObjectId if it's a valid ObjectId string
      query.companyId = mongoose.Types.ObjectId.isValid(companyId)
        ? new mongoose.Types.ObjectId(companyId)
        : companyId;
      console.log("✅ Filtering by user companyId:", query.companyId.toString());
    } else if (req.query.companyId) {
      // Admin can filter by specific companyId
      query.companyId = mongoose.Types.ObjectId.isValid(req.query.companyId)
        ? new mongoose.Types.ObjectId(req.query.companyId)
        : req.query.companyId;
      console.log("✅ Filtering by query companyId:", query.companyId.toString());
    } else if (userRole === "Admin") {
      // Admin - show all roles if no companyId filter
      query = {};
      console.log("✅ Admin user - showing all roles");
    } else {
      // Non-admin without companyId - return empty
      console.log("⚠️ Non-admin without companyId - returning empty array");
      return res.status(200).json({
        success: true,
        roles: [],
        count: 0,
        message: "No company ID found for user",
      });
    }

    console.log("🔍 Final query:", {
      companyId: query.companyId?.toString(),
      hasCompanyId: !!query.companyId,
      queryType: query.companyId ? "byCompanyId" : "all",
      queryObject: query,
    });

    // Also check ALL roles in DB for debugging
    const allRolesInDB = await Role.find({}).lean();
    console.log("📊 All roles in DB:", {
      total: allRolesInDB.length,
      roles: allRolesInDB.map(r => ({
        id: r._id?.toString(),
        name: r.name,
        companyId: r.companyId?.toString(),
        companyIdType: typeof r.companyId,
      })),
    });

    // Execute query
    const roles = await Role.find(query)
      .populate("createdBy", "name lastName")
      .sort({ createdAt: -1 })
      .lean();

    console.log("✅ Found roles matching query:", {
      count: roles.length,
      queryCompanyId: query.companyId?.toString() || "all",
      queryType: query.companyId ? "filtered" : "all",
      roles: roles.map(r => ({
        id: r._id?.toString(),
        name: r.name,
        companyId: r.companyId?.toString(),
      })),
    });

    // Ensure roles is always an array
    const rolesArray = Array.isArray(roles) ? roles : [];

    console.log("📤 Sending response:", {
      success: true,
      rolesCount: rolesArray.length,
      firstRole: rolesArray[0] || null,
    });

    res.status(200).json({
      success: true,
      roles: rolesArray,
      count: rolesArray.length,
    });
  } catch (error) {
    console.error("❌ Error getting all roles:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get role by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id).populate("createdBy", "name lastName");

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if user has access to this role's company
    if (req.user.role !== "Admin" && role.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Access denied",
      });
    }

    res.status(200).json({
      success: true,
      role,
    });
  } catch (error) {
    console.error("Error getting role by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Create a new role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createRole = async (req, res) => {
  try {
    const { name, companyId, permissions, description, isDefault } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    // Use user's companyId if not provided (non-Admin)
    const roleCompanyId = companyId || req.user.companyId;

    if (!roleCompanyId && req.user.role !== "Admin") {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    // Check if role name already exists for this company
    const existingRole = await Role.findOne({
      name,
      companyId: roleCompanyId,
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists for this company",
      });
    }

    // Validate and normalize permissions
    // Valid modules from Permission model
    const validModules = [
      "products", "suppliers", "finance", "budgets", "procurement",
      "projects", "employees", "signatures", "departments", "reports",
      "tasks", "customers", "events", "settings", "invoices",
      "inventory", "analytics", "shifts", "salary", "ai", "roles"
    ];
    
    const validActions = ["view", "create", "update", "delete", "approve", "export"];
    
    let normalizedPermissions = [];
    if (permissions && Array.isArray(permissions)) {
      normalizedPermissions = permissions.map((perm) => {
        // Ensure permission has module and actions
        if (typeof perm === "object" && perm.module && Array.isArray(perm.actions)) {
          const moduleName = perm.module.trim();
          
          // Validate module
          if (!validModules.includes(moduleName)) {
            console.warn(`⚠️ Invalid module: ${moduleName}. Skipping permission.`);
            return null;
          }
          
          // Filter and validate actions
          const validActionsList = perm.actions.filter((action) => 
            validActions.includes(action)
          );
          
          if (validActionsList.length === 0) {
            console.warn(`⚠️ No valid actions for module ${moduleName}. Skipping permission.`);
            return null;
          }
          
          return {
            module: moduleName,
            actions: validActionsList,
          };
        }
        return null;
      }).filter((perm) => perm !== null && perm.actions.length > 0);
    }

    const role = new Role({
      name,
      companyId: roleCompanyId,
      permissions: normalizedPermissions,
      description,
      isDefault: isDefault || false,
      createdBy: req.user._id,
    });

    await role.save();

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      role,
    });
  } catch (error) {
    console.error("❌ Error creating role:", error);
    console.error("Error stack:", error.stack);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists for this company",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Update a role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, description, isDefault } = req.body;

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if user has access to this role's company
    if (req.user.role !== "Admin" && role.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Access denied",
      });
    }

    // Check if can edit
    if (!role.canEdit) {
      return res.status(403).json({
        success: false,
        message: "This role cannot be edited",
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({
        name,
        companyId: role.companyId,
        _id: { $ne: id },
      });

      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: "Role with this name already exists for this company",
        });
      }
      role.name = name;
    }

    // Validate and normalize permissions if provided
    if (permissions !== undefined) {
      // Valid modules from Permission model - MUST MATCH Permission.model.js enum exactly
      const validModules = [
        "products", "suppliers", "finance", "budgets", "procurement",
        "projects", "employees", "signatures", "departments", "reports",
        "tasks", "customers", "events", "settings", "invoices",
        "inventory", "analytics", "shifts", "salary", "ai", "roles"
      ];
      
      const validActions = ["view", "create", "update", "delete", "approve", "export"];
      
      // Log incoming permissions
      console.log("📥 Received permissions:", JSON.stringify(permissions, null, 2));
      
      let normalizedPermissions = [];
      if (Array.isArray(permissions)) {
        normalizedPermissions = permissions.map((perm, index) => {
          // Ensure permission has module and actions
          if (typeof perm === "object" && perm.module && Array.isArray(perm.actions)) {
            const moduleName = perm.module.trim();
            
            // Validate module
            if (!validModules.includes(moduleName)) {
              console.warn(`⚠️ [${index}] Invalid module: "${moduleName}". Valid modules:`, validModules);
              return null;
            }
            
            // Filter and validate actions
            const validActionsList = perm.actions.filter((action) => 
              validActions.includes(action)
            );
            
            if (validActionsList.length === 0) {
              console.warn(`⚠️ [${index}] No valid actions for module "${moduleName}". Skipping permission.`);
              return null;
            }
            
            console.log(`✅ [${index}] Valid permission: ${moduleName} -> ${validActionsList.join(", ")}`);
            return {
              module: moduleName,
              actions: validActionsList,
            };
          }
          console.warn(`⚠️ Invalid permission format at index ${index}:`, perm);
          return null;
        }).filter((perm) => perm !== null && perm.actions.length > 0);
      }
      
      // Log normalized permissions before saving
      console.log("📝 Normalized permissions:", JSON.stringify(normalizedPermissions, null, 2));
      console.log(`📊 Total permissions: ${normalizedPermissions.length}`);
      
      // Set permissions - Mongoose will validate against the schema
      role.permissions = normalizedPermissions;
    }
    if (description !== undefined) {
      role.description = description;
    }
    if (isDefault !== undefined) {
      role.isDefault = isDefault;
    }

    // Log role before validation
    console.log("🔍 Role before save:", {
      id: role._id,
      name: role.name,
      permissionsCount: role.permissions?.length || 0,
      permissions: role.permissions?.map(p => `${p.module}: [${p.actions.join(", ")}]`),
    });

    // Validate the role before saving
    try {
      await role.validate();
      console.log("✅ Role validation passed");
    } catch (validationError) {
      console.error("❌ Role validation failed:", validationError.message);
      if (validationError.errors) {
        Object.keys(validationError.errors).forEach(key => {
          console.error(`  - ${key}: ${validationError.errors[key].message}`);
        });
      }
      throw validationError;
    }

    await role.save();

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      role,
    });
  } catch (error) {
    console.error("❌ Error updating role:", error);
    console.error("Error stack:", error.stack);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists for this company",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Delete a role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if user has access to this role's company
    if (req.user.role !== "Admin" && role.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Access denied",
      });
    }

    // Check if can edit
    if (!role.canEdit) {
      return res.status(403).json({
        success: false,
        message: "This role cannot be deleted",
      });
    }

    // Check if role is assigned to any employees
    const employeesWithRole = await Employee.countDocuments({ roleId: id });

    if (employeesWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. It is assigned to ${employeesWithRole} employee(s)`,
      });
    }

    await Role.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Assign role to employee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const assignRoleToEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { roleId } = req.body;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if user has access to this employee's company
    if (req.user.role !== "Admin" && employee.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Access denied",
      });
    }

    // If roleId is provided, validate it
    if (roleId) {
      const role = await Role.findById(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      // Check if role belongs to employee's company
      if (req.user.role !== "Admin" && role.companyId.toString() !== employee.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Role does not belong to employee's company",
        });
      }
    }

    // Update employee's roleId
    employee.roleId = roleId || null;
    await employee.save();

    res.status(200).json({
      success: true,
      message: "Role assigned to employee successfully",
      employee,
    });
  } catch (error) {
    console.error("Error assigning role to employee:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

