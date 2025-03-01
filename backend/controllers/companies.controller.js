import Companies from "../models/companies.model.js";
import { generateCompanyToken } from "../config/utils/generateToken.js";
import { SendRegistrationEmployee } from "../emails/emailService.js";
import jwt from "jsonwebtoken";

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const { name, email, phone, website, address, industry, taxId, logo } =
      req.body;

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

    if (newCompany) {
      await newCompany.save();
      generateCompanyToken(newCompany._id, res);
      return res.status(201).json({
        success: true,
        message: "Company created successfully",
      });
    }
  } catch (error) {
    console.log("Error in creating company controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating company",
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
    const token = req.cookies["auth_token"];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

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
