import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Employee from "../models/employees.model.js";

dotenv.config();

export const protectRoute = async (req, res, next) => {
  try {
    // Check if the token is present in the cookies or Authorization header
    let token = req.cookies["auth_token"];
    
    // If no cookie token, check Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid token" });
    }

    // Find the user based on the decoded ID
    const user = await Employee.findById(decoded.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }


    // Attach the user to the request object for further use in the route
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Middleware for routes that can be accessed by either a user or a company token
export const protectCompanyOrUserRoute = async (req, res, next) => {
  try {
    // Try to get token from multiple sources
    let token = req.cookies["auth_token"] || req.cookies["company_jwt"];
    
    // If no cookie token, check Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      console.log("No token found in cookies or headers");
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No token provided",
        error: "Please log in to continue"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - Invalid token",
        error: "Token verification failed"
      });
    }

    console.log("Decoded token:", decoded);

    // Check if it's a user token or company token
    if (decoded.userId) {
      // User token - find the user
      const user = await Employee.findById(decoded.userId).select("-password");
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found",
          error: "Employee account not found"
        });
      }
      req.user = user;
      console.log("Authenticated as user:", user._id, "Company:", user.company);
    } else if (decoded.companyId) {
      // Company token - just attach the companyId
      req.user = { companyId: decoded.companyId };
      console.log("Authenticated as company:", decoded.companyId);
    } else {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token format",
        error: "Token does not contain userId or companyId"
      });
    }

    next();
  } catch (error) {
    console.error("Error in protectCompanyOrUserRoute middleware:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message
    });
  }
};

export const protectAdminsRoute = async (req, res, next) => {
  try {
    // Get the admin emails from environment variables
    const admins = [process.env.BEN_ADMIN_EMAIL, process.env.SHAY_ADMIN_EMAIL];

    // Check if the current user is one of the admins
    if (!admins.includes(req.user.email)) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Not an admin" });
    }

    // Proceed to the next middleware if the user is an admin
    next();
  } catch (error) {
    console.error("Error in protectAdmins middleware:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
