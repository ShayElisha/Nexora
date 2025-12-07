/**
 * Middleware to check if resource belongs to user's company
 * Admin and SuperAdmin can access all companies
 */
export const checkCompany = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - User not authenticated" 
      });
    }

    // Admin can access all companies (no SuperAdmin in Nexora)
    if (req.user.role === 'Admin') {
      return next();
    }

    // Get company ID from params, body, or query
    const resourceCompanyId = req.params.companyId || 
                               req.body.companyId || 
                               req.query.companyId;

    if (!resourceCompanyId) {
      // If no companyId specified, allow access (might be global resource)
      return next();
    }

    // Check if resource belongs to user's company
    if (resourceCompanyId.toString() !== req.user.companyId?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Forbidden - Resource does not belong to your company" 
      });
    }

    next();
  } catch (error) {
    console.error("Error in checkCompany middleware:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

