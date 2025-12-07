import Customer from "../models/customers.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { paginateResponse } from "../middleware/pagination.js";

// Create a new customer
export const createCustomer = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const employeeId = decodedToken?.employeeId;
    const companyId = decodedToken?.companyId;
    const {
      name,
      email,
      phone,
      address,
      company,
      website,
      industry,
      status,
      customerType,
      dateOfBirth,
      gender,
      preferredContactMethod,
      lastContacted,
      customerSince,
      contacts,
      notes,
    } = req.body;

    // בדיקת שדות חובה – במקרה זה name ו-email
    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }

    // יצירת לקוח חדש
    const newCustomer = new Customer({
      companyId: companyId,
      name,
      email,
      phone,
      address,
      company,
      website,
      industry,
      status,
      customerType,
      dateOfBirth,
      gender,
      preferredContactMethod,
      lastContacted,
      customerSince,
      contacts, // מערך אנשי קשר
      notes,
      createdBy: employeeId,
    });

    await newCustomer.save();
    return res.status(201).json({ success: true, data: newCustomer });
  } catch (error) {
    console.error("Error creating customer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken?.companyId;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = { companyId };
    
    // Optional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.customerType) {
      query.customerType = req.query.customerType;
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
        { phone: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Customer.countDocuments(query);
    
    // Get paginated results
    const customers = await Customer.find(query)
      .populate("companyId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    return res.status(200).json(paginateResponse(customers, pagination));
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get customers for SuperAdmin (by companyId)
export const getCustomersForSuperAdmin = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const customers = await Customer.find({ companyId }).populate("companyId");
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error("Error fetching customers for SuperAdmin:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer id" });
    }
    const customer = await Customer.findById(id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update customer by ID
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer id" });
    }
    const updatedCustomer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({
      success: true,
      data: updatedCustomer,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete customer by ID
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer id" });
    }
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: deletedCustomer,
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
