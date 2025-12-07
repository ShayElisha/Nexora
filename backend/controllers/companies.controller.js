import Companies from "../models/companies.model.js";
import Employee from "../models/employees.model.js";
import { generateCompanyToken } from "../config/utils/generateToken.js";
import { SendRegistrationEmployee } from "../emails/emailService.js";
import jwt from "jsonwebtoken";

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const { name, email, phone, website, address, industry, taxId, logo } =
      req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Company name and email are required",
      });
    }

    // Check if company with this email already exists
    const existingCompany = await Companies.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        error: "A company with this email already exists",
      });
    }

    const newCompany = new Companies({
      name,
      email,
      phone,
      website,
      address,
      industry,
      taxId,
      logo,
    });

    await newCompany.save();
    generateCompanyToken(newCompany._id, res);
    
    return res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: {
        company: newCompany,
      },
    });
  } catch (error) {
    console.log("Error in creating company controller:", error.message);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `A company with this ${field} already exists`,
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || "Error creating company",
    });
  }
};

// Get current company (for authenticated user)
export const getCurrentCompany = async (req, res) => {
  try {
    const token = req.cookies["auth_token"] || req.cookies["company_jwt"];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized",
        error: "No authentication token found"
      });
    }
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If it's a user token (userId), we need to fetch the user's company
    if (!companyId && decodedToken.userId) {
      const user = await Employee.findById(decodedToken.userId);
      if (user) {
        companyId = user.companyId || user.company;
        console.log("Company ID from user:", companyId);
      }
    }

    if (!companyId) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const company = await Companies.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Error fetching current company:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Error fetching company",
      error: error.message,
    });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"] || req.cookies["company_jwt"];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized",
        error: "No authentication token found"
      });
    }
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If it's a user token (userId), we need to fetch the user's company
    if (!companyId && decodedToken.userId) {
      const user = await Employee.findById(decodedToken.userId);
      if (user) {
        companyId = user.companyId || user.company;
        console.log("Company ID from user:", companyId);
      }
    }
    
    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: "Company ID is required",
        error: "Token does not contain company ID and no associated user found"
      });
    }

    // Check if the company exists
    const company = await Companies.findById(companyId);
    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: "Company not found",
        error: `No company found with ID: ${companyId}`
      });
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
// update a company
export const updateCompany = async (req, res) => {
  try {
    const { name, email, phone, website, address, industry, taxId, logo } =
      req.body;

    const companyId = req.user.companyId;
    const updatedCompany = await Companies.findByIdAndUpdate(
      companyId,
      { name, email, phone, website, address, industry, taxId, logo },
      { new: true }
    );

    if (!updatedCompany) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Company updated successfully" });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// delete a company
export const deleteCompany = async (req, res) => {};

// get all companies
export const getAllCompanies = async (req, res) => {
  try {
    // Fetch all companies from the database
    const companies = await Companies.find({});

    if (!companies || companies.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Companies not found" });
    }

    res.json(companies);
  } catch (error) {
    console.log("Error in getAllCompanies controller:", error.message);
    res.status(500).json({
      success: false,
      message: "Error getting companies",
      error: error.message,
    });
  }
};
export const sendSignUpLink = async (req, res) => {
  try {
    const token = req.cookies["auth_token"] || req.cookies["company_jwt"];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized",
        error: "No authentication token found"
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If it's a user token, get company from user
    if (!companyId && decodedToken.userId) {
      const user = await Employee.findById(decodedToken.userId);
      if (user) {
        companyId = user.company;
      }
    }

    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const company = await Companies.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const companyName = company.name;
    const signUpUrl = `http://localhost:5173/signup?companyId=${companyId}`;
    await SendRegistrationEmployee(email, companyName, signUpUrl);

    return res
      .status(200)
      .json({ success: true, message: "Sign-up email sent successfully" });
  } catch (error) {
    console.error("Error in sendSignUpLink:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
