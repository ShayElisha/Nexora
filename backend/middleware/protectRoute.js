import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Employee from "../models/employees.model.js";

dotenv.config();

export const protectRoute = async (req, res, next) => {
  try {
    // Check if the token is present in the cookies
    const token = req.cookies["auth_token"];
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
