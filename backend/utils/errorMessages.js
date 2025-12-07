/**
 * Centralized Error Messages
 * All error messages should be in English for consistency
 * Frontend will handle translation based on user's language preference
 */

export const ERROR_MESSAGES = {
  // Authentication Errors
  UNAUTHORIZED: "Unauthorized",
  NO_TOKEN_PROVIDED: "No token provided",
  INVALID_TOKEN: "Invalid token",
  TOKEN_EXPIRED: "Token expired",
  TOKEN_VERIFICATION_FAILED: "Token verification failed",
  USER_NOT_FOUND: "User not found",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED: "Account is locked",
  SESSION_EXPIRED: "Session expired",
  
  // Authorization Errors
  FORBIDDEN: "Forbidden",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
  ADMIN_ACCESS_REQUIRED: "Admin access required",
  ROLE_REQUIRED: "Role access required",
  
  // Validation Errors
  VALIDATION_ERROR: "Validation error",
  REQUIRED_FIELD: "Required field is missing",
  INVALID_EMAIL: "Invalid email format",
  INVALID_PHONE: "Invalid phone number format",
  INVALID_DATE: "Invalid date format",
  INVALID_ID: "Invalid ID format",
  DUPLICATE_ENTRY: "Duplicate entry",
  FIELD_ALREADY_EXISTS: "Field already exists",
  
  // Resource Errors
  NOT_FOUND: "Resource not found",
  ALREADY_EXISTS: "Resource already exists",
  DELETED: "Resource has been deleted",
  
  // Server Errors
  INTERNAL_SERVER_ERROR: "Internal server error",
  DATABASE_ERROR: "Database error",
  OPERATION_FAILED: "Operation failed",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  
  // Business Logic Errors
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_OPERATION: "Invalid operation",
  OPERATION_NOT_ALLOWED: "Operation not allowed",
  INVALID_STATUS: "Invalid status",
  
  // File Upload Errors
  FILE_TOO_LARGE: "File size exceeds limit",
  INVALID_FILE_TYPE: "Invalid file type",
  UPLOAD_FAILED: "File upload failed",
  
  // Rate Limiting
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  OPERATION_SUCCESS: "Operation completed successfully",
};

/**
 * Helper function to get error message
 * @param {string} key - Error message key
 * @param {object} params - Optional parameters for message interpolation
 * @returns {string} Error message
 */
export const getErrorMessage = (key, params = {}) => {
  const message = ERROR_MESSAGES[key] || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  
  // Simple parameter replacement
  return Object.keys(params).reduce((msg, param) => {
    return msg.replace(`{{${param}}}`, params[param]);
  }, message);
};

/**
 * Helper function to get success message
 * @param {string} key - Success message key
 * @param {object} params - Optional parameters for message interpolation
 * @returns {string} Success message
 */
export const getSuccessMessage = (key, params = {}) => {
  const message = SUCCESS_MESSAGES[key] || SUCCESS_MESSAGES.OPERATION_SUCCESS;
  
  // Simple parameter replacement
  return Object.keys(params).reduce((msg, param) => {
    return msg.replace(`{{${param}}}`, params[param]);
  }, message);
};

