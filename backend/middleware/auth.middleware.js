import { AuthService } from "../services/auth.service.js";
import Employee from "../models/employees.model.js";
import Company from "../models/companies.model.js";
import { ERROR_MESSAGES, getErrorMessage } from "../utils/errorMessages.js";

/**
 * Extract token from request (cookies or Authorization header)
 * @param {object} req - Express request object
 * @returns {string|null} Token or null if not found
 */
const extractToken = (req) => {
  // Check cookies first
  let token = req.cookies["auth_token"] || req.cookies["company_jwt"];
  
  // If no cookie token, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  
  return token || null;
};

/**
 * Unified Authentication Middleware
 * Supports both access tokens and refresh tokens
 * This is the main middleware that should be used for all protected routes
 */
export const protectRoute = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
        error: getErrorMessage("NO_TOKEN_PROVIDED"),
      });
    }

    try {
      // Verify access token
      const decoded = AuthService.verifyAccessToken(token);
      
      // Find the user
      const user = await Employee.findById(decoded.userId).select("-password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
          error: getErrorMessage("USER_NOT_FOUND"),
        });
      }

      // Attach user and decoded token to request
      req.user = user;
      req.decoded = decoded;
      next();
    } catch (error) {
      // If access token is expired, try refresh token
      if (error.message.includes("expired") || error.name === "TokenExpiredError") {
        return handleRefreshToken(req, res, next);
      }

      // Invalid token
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
        error: getErrorMessage("TOKEN_VERIFICATION_FAILED"),
      });
    }
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};

/**
 * Handle refresh token when access token expires
 */
const handleRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies["auth_refresh_token"];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.TOKEN_EXPIRED,
        error: getErrorMessage("SESSION_EXPIRED"),
      });
    }

    const decoded = AuthService.verifyRefreshToken(refreshToken);
    
    // Find the user
    const user = await Employee.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
        error: getErrorMessage("USER_NOT_FOUND"),
      });
    }

    // Generate new access token
    const newAccessToken = AuthService.generateAccessToken({
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
      imageURL: decoded.imageURL,
      employeeId: decoded.employeeId,
    });

    // Set new access token cookie
    res.cookie("auth_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    req.user = user;
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
      error: getErrorMessage("TOKEN_VERIFICATION_FAILED"),
    });
  }
};

/**
 * Middleware for routes that can be accessed by either a user or a company token
 */
export const protectCompanyOrUserRoute = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.NO_TOKEN_PROVIDED,
        error: getErrorMessage("NO_TOKEN_PROVIDED"),
      });
    }

    try {
      const decoded = AuthService.verifyAccessToken(token);

      // Check if it's a user token or company token
      if (decoded.userId) {
        // User token - find the user
        const user = await Employee.findById(decoded.userId).select("-password");
        if (!user) {
          return res.status(404).json({
            success: false,
            message: ERROR_MESSAGES.USER_NOT_FOUND,
            error: getErrorMessage("USER_NOT_FOUND"),
          });
        }
        req.user = user;
        req.decoded = decoded;
      } else if (decoded.companyId) {
        // Company token - find the company
        const company = await Company.findById(decoded.companyId);
        if (!company) {
          return res.status(404).json({
            success: false,
            message: "Company not found",
            error: getErrorMessage("NOT_FOUND"),
          });
        }
        req.user = { companyId: decoded.companyId };
        req.company = company;
        req.decoded = decoded;
      } else {
        return res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_TOKEN,
          error: "Token does not contain userId or companyId",
        });
      }

      next();
    } catch (error) {
      if (error.message.includes("expired") || error.name === "TokenExpiredError") {
        return handleRefreshToken(req, res, next);
      }
      
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
        error: getErrorMessage("TOKEN_VERIFICATION_FAILED"),
      });
    }
  } catch (error) {
    console.error("Error in protectCompanyOrUserRoute middleware:", error.message);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};

/**
 * Middleware to protect admin routes
 */
export const protectAdminsRoute = async (req, res, next) => {
  try {
    // First ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: getErrorMessage("NO_TOKEN_PROVIDED"),
      });
    }

    // Get the admin emails from environment variables
    const admins = [
      process.env.BEN_ADMIN_EMAIL,
      process.env.SHAY_ADMIN_EMAIL,
    ].filter(Boolean);

    // Check if the current user is one of the admins
    if (!admins.includes(req.user.email)) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
        error: getErrorMessage("ADMIN_ACCESS_REQUIRED"),
      });
    }

    next();
  } catch (error) {
    console.error("Error in protectAdminsRoute middleware:", error.message);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};

/**
 * Middleware to check if user has specific role
 * @param {...string} roles - Roles that are allowed to access the route
 * @returns {Function} Middleware function
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: getErrorMessage("NO_TOKEN_PROVIDED"),
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
        error: getErrorMessage("INSUFFICIENT_PERMISSIONS"),
      });
    }

    next();
  };
};

/**
 * Helper middleware to extract companyId from authenticated user
 * This should be used after protectRoute middleware
 */
export const extractCompanyId = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
        error: getErrorMessage("NO_TOKEN_PROVIDED"),
      });
    }

    // Get companyId from user or decoded token
    req.companyId = req.user.companyId || req.decoded?.companyId;
    
    if (!req.companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID not found",
        error: "User must be associated with a company",
      });
    }

    next();
  } catch (error) {
    console.error("Error in extractCompanyId middleware:", error.message);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      error: error.message,
    });
  }
};
