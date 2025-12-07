import SalesOpportunity from "../models/SalesOpportunity.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const verifyToken = (req) => {
  const token = req.cookies?.auth_token;
  if (!token) throw new Error("Unauthorized: No token provided");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Create Sales Opportunity
export const createSalesOpportunity = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const opportunity = new SalesOpportunity({
      ...req.body,
      companyId: decoded.companyId,
    });
    await opportunity.save();
    res.status(201).json({ success: true, data: opportunity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Sales Opportunities
export const getAllSalesOpportunities = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { stage, status, assignedTo } = req.query;
    const filter = { companyId: decoded.companyId };
    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const opportunities = await SalesOpportunity.find(filter)
      .populate("leadId", "name email")
      .populate("customerId", "name email")
      .populate("assignedTo", "name lastName")
      .sort({ expectedCloseDate: -1 });

    res.status(200).json({ success: true, data: opportunities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Sales Pipeline
export const getSalesPipeline = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const pipeline = await SalesOpportunity.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(decoded.companyId), status: "Open" } },
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          opportunities: { $push: "$$ROOT" },
        },
      },
    ]);
    res.status(200).json({ success: true, data: pipeline });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Sales Opportunity
export const updateSalesOpportunity = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const opportunity = await SalesOpportunity.findOneAndUpdate(
      { _id: id, companyId: decoded.companyId },
      req.body,
      { new: true }
    );
    if (!opportunity) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Sales Opportunity
export const deleteSalesOpportunity = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    await SalesOpportunity.findOneAndDelete({
      _id: id,
      companyId: decoded.companyId,
    });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

