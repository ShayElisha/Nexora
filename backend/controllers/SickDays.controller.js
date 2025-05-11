import SickDays from "../models/SickDays.models.js";
import jwt from "jsonwebtoken";

// Create a new sick days policy
export const createPolicy = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const companyId = decodedToken.companyId;
    const {
      country,
      accrual_rate,
      max_accrual,
      carry_over,
      waiting_period,
      paid_percentage,
    } = req.body;

    if (
      !country ||
      !accrual_rate ||
      !max_accrual ||
      !carry_over ||
      !waiting_period ||
      !paid_percentage
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newPolicy = new SickDays({
      companyId,
      country,
      accrual_rate,
      max_accrual,
      carry_over,
      waiting_period,
      paid_percentage,
    });

    await newPolicy.save();
    res
      .status(201)
      .json({ message: "Policy created successfully", data: newPolicy });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all sick days policies
export const getAllPolicies = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const companyId = decodedToken.companyId;
    const policies = await SickDays.find({ companyId });
    res.status(200).json({ data: policies });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single policy by ID
export const getPolicyById = async (req, res) => {
  try {
    const policy = await SickDays.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    res.status(200).json({ data: policy });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a policy by ID
export const updatePolicy = async (req, res) => {
  try {
    const {
      country,
      accrual_rate,
      max_accrual,
      carry_over,
      waiting_period,
      paid_percentage,
    } = req.body;

    const policy = await SickDays.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    policy.country = country || policy.country;
    policy.accrual_rate = accrual_rate || policy.accrual_rate;
    policy.max_accrual = max_accrual || policy.max_accrual;
    policy.carry_over = carry_over || policy.carry_over;
    policy.waiting_period = waiting_period || policy.waiting_period;
    policy.paid_percentage = paid_percentage || policy.paid_percentage;

    await policy.save();
    res
      .status(200)
      .json({ message: "Policy updated successfully", data: policy });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a policy by ID
export const deletePolicy = async (req, res) => {
  try {
    const policy = await SickDays.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    await policy.deleteOne();
    res.status(200).json({ message: "Policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
