import Companies from "../models/companies.model.js";
import { sendCompanyApprovalEmail } from "../emails/emailService.js";
import { generateTokenAndSendEmail } from "../config/utils/generateToken.js";

/**
 * Fetch all companies with status "Pending".
 */
export const getPendingCompanies = async (req, res) => {
  try {
    // Query the database for companies with status "Pending"
    const pendingCompanies = await Companies.find({ status: "Pending" });

    return res.status(200).json({
      success: true,
      data: pendingCompanies,
    });
  } catch (error) {
    console.error("Error fetching pending companies:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching pending companies",
      error: error.message,
    });
  }
};

/**
 * Approve a company by ID and send an email notification.
 */
export const approveCompany = async (req, res) => {
  try {
    const { id } = req.body; // Extract the company ID from the request body

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }

    // Check if the company exists in the database
    const company = await Companies.findById(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // Update the company's status to "Active"
    company.status = "Active";
    await company.save();

    // Generate a token and send the approval email
    const signUpUrl = `${process.env.CLIENT_URL}/signup`;
    await generateTokenAndSendEmail(res, company._id);
    await sendCompanyApprovalEmail(
      company.email,
      company.name || company.companyName,
      signUpUrl
    );

    res.clearCookie("company_jwt"); // Clear the company JWT cookie from the response cookies["company_jwt"];

    return res.status(200).json({
      success: true,
      message: "Company approved successfully, email sent.",
    });
  } catch (error) {
    console.error("Error approving company:", error);
    return res.status(500).json({
      success: false,
      message: "Error approving company",
      error: error.message,
    });
  }
};

/**
 * Reject a company by ID and update its status to "Inactive".
 */
export const rejectCompany = async (req, res) => {
  try {
    const { id } = req.body; // Extract the company ID from the request body

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }

    // Check if the company exists
    const company = await Companies.findById(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // Update the status to "Inactive"
    company.status = "Inactive";
    await company.save();

    return res.status(200).json({
      success: true,
      message: "Company rejected successfully.",
    });
  } catch (error) {
    console.error("Error rejecting company:", error);
    return res.status(500).json({
      success: false,
      message: "Error rejecting company",
      error: error.message,
    });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params; // Extract the company ID from the request parameters

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }

    // Check if the company exists
    const company = await Companies.findById(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Error retrieving company:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving company",
      error: error.message,
    });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    // Query the database for all companies
    const companies = await Companies.find({});

    return res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("Error retrieving companies:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving companies",
      error: error.message,
    });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params; // Extract the company ID from the request parameters

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }

    // Check if the company exists
    const company = await Companies.findById(id);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    // Delete the company from the database
    await Companies.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Company deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting company",
      error: error.message,
    });
  }
};

export const searchCompanies = async (req, res) => {
  try {
    const { name, industry, status, plan, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (name) filters.name = { $regex: name, $options: "i" }; // Case-insensitive name search
    if (industry) filters.industry = industry;
    if (status) filters.status = status;
    if (plan) filters["subscription.plan"] = plan;

    const companies = await Companies.find(filters)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Companies.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: companies,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error searching companies:", error.message);
    res.status(500).json({
      success: false,
      message: "Error searching companies",
      error: error.message,
    });
  }
};

export const getCompaniesWithPagination = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const companies = await Companies.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }); // Sort by newest companies first

    const total = await Companies.countDocuments();

    res.status(200).json({
      success: true,
      data: companies,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching paginated companies:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching companies",
      error: error.message,
    });
  }
};

export const getCompaniesWithOverdueInvoices = async (req, res) => {
  try {
    const overdueCompanies = await Companies.find({
      "subscription.invoices": {
        $elemMatch: { status: "Unpaid", dueDate: { $lt: new Date() } },
      },
    }).populate("subscription.invoices.invoiceId");

    res.status(200).json({
      success: true,
      data: overdueCompanies,
    });
  } catch (error) {
    console.error(
      "Error fetching companies with overdue invoices:",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "Error fetching overdue companies",
      error: error.message,
    });
  }
};

export const forceUpdateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Active", "Pending", "Inactive"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const company = await Companies.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    res.status(200).json({
      success: true,
      message: "Company status updated successfully",
      data: company,
    });
  } catch (error) {
    console.error("Error updating company status:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating company status",
      error: error.message,
    });
  }
};

export const getCompanyStatistics = async (req, res) => {
  try {
    const totalCompanies = await Companies.countDocuments();
    const activeCompanies = await Companies.countDocuments({
      status: "Active",
    });
    const pendingCompanies = await Companies.countDocuments({
      status: "Pending",
    });
    const inactiveCompanies = await Companies.countDocuments({
      status: "Inactive",
    });

    const overdueInvoicesCount = await Companies.aggregate([
      { $unwind: "$subscription.invoices" },
      {
        $match: {
          "subscription.invoices.status": "Unpaid",
          "subscription.invoices.dueDate": { $lt: new Date() },
        },
      },
      { $count: "overdueInvoices" },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        pendingCompanies,
        inactiveCompanies,
        overdueInvoices: overdueInvoicesCount[0]?.overdueInvoices || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching company statistics:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching company statistics",
      error: error.message,
    });
  }
};
