import axiosInstance from "../lib/axios";

/**
 * Fetch all roles for a company
 * @param {boolean} includeDefaults - Include default roles
 * @returns {Promise<Array>} Array of roles
 */
export const fetchAllRoles = async (includeDefaults = false) => {
  try {
    const params = includeDefaults ? { includeDefaults: true } : {};
    
    console.log("📤 fetchAllRoles - Making request:", {
      url: "/roles",
      params,
    });
    
    const response = await axiosInstance.get("/roles", { params });
    
    console.log("📥 fetchAllRoles - Response received:", {
      status: response.status,
      success: response.data?.success,
      count: response.data?.count,
      rolesLength: response.data?.roles?.length,
      message: response.data?.message,
      fullResponse: response.data, // Log full response for debugging
    });
    
    // Handle response structure - check ALL possible structures
    if (response.data) {
      // Check if response.data.roles exists and is array
      if (response.data.roles !== undefined) {
        if (Array.isArray(response.data.roles)) {
          console.log("✅ Returning roles from response.data.roles:", response.data.roles.length);
          return response.data.roles;
        } else {
          console.warn("⚠️ response.data.roles exists but is not an array:", typeof response.data.roles);
        }
      }
      
      // Check if response.data is directly an array
      if (Array.isArray(response.data)) {
        console.log("✅ Returning roles from response.data (direct array):", response.data.length);
        return response.data;
      }
      
      // Check if response.data has a data property with roles
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log("✅ Returning roles from response.data.data:", response.data.data.length);
        return response.data.data;
      }
    }
    
    console.warn("⚠️ No roles found in response structure:", {
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      dataType: typeof response.data,
    });
    return [];
  } catch (error) {
    console.error("❌ Error fetching roles:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

/**
 * Fetch role by ID
 * @param {string} roleId - Role ID
 * @returns {Promise<Object>} Role object
 */
export const fetchRoleById = async (roleId) => {
  try {
    const response = await axiosInstance.get(`/roles/${roleId}`);
    return response.data.role || response.data;
  } catch (error) {
    console.error("Error fetching role by ID:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch default roles
 * @returns {Promise<Array>} Array of default roles
 */
export const fetchDefaultRoles = async () => {
  try {
    const response = await axiosInstance.get("/roles/defaults");
    return response.data.roles || [];
  } catch (error) {
    console.error("Error fetching default roles:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data (name, description, permissions)
 * @returns {Promise<Object>} Created role
 */
export const createRole = async (roleData) => {
  try {
    const response = await axiosInstance.post("/roles", roleData);
    return response.data.role || response.data;
  } catch (error) {
    console.error("Error creating role:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update a role
 * @param {string} roleId - Role ID
 * @param {Object} roleData - Updated role data
 * @returns {Promise<Object>} Updated role
 */
export const updateRole = async (roleId, roleData) => {
  try {
    const response = await axiosInstance.put(`/roles/${roleId}`, roleData);
    return response.data.role || response.data;
  } catch (error) {
    console.error("Error updating role:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Delete a role
 * @param {string} roleId - Role ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteRole = async (roleId) => {
  try {
    const response = await axiosInstance.delete(`/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting role:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Assign role to employee
 * @param {string} employeeId - Employee ID
 * @param {string} roleId - Role ID
 * @returns {Promise<Object>} Assignment result
 */
export const assignRoleToEmployee = async (employeeId, roleId) => {
  try {
    const response = await axiosInstance.put(`/roles/assign/${employeeId}`, { roleId });
    return response.data;
  } catch (error) {
    console.error("Error assigning role to employee:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch all available permissions (modules and actions)
 * @returns {Promise<Object>} Object with modules and actions arrays
 */
export const fetchAllAvailablePermissions = async () => {
  try {
    const response = await axiosInstance.get("/permissions/available");
    
    if (response.data && response.data.success) {
      return {
        modules: response.data.modules || [],
        actions: response.data.actions || [],
      };
    }
    
    return {
      modules: response.data.modules || [],
      actions: response.data.actions || [],
    };
  } catch (error) {
    console.error("Error fetching available permissions:", error.response?.data || error.message);
    // Return empty arrays on error - component will use defaults
    return {
      modules: [],
      actions: [],
    };
  }
};
