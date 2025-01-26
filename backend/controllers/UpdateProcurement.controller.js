// Import the PendingUpdate model
import PendingUpdate from "../models/UpdateProcurement.model.js";
import Suppliers from "../models/suppliers.model.js";
import Procurement from "../models/procurement.model.js";
import jwt from "jsonwebtoken";
import { sendProcurementUpdateEmail } from "../emails/emailService.js";

// Create a new pending update
export const createPendingUpdate = async (req, res) => {
  const { ProcurementId, updatedData } = req.body;
  const token = req.cookies["auth_token"];

  console.log("Token:", token);
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const changedBy = decodedToken.employeeId;

  console.log("Procurement ID:", ProcurementId);
  console.log("Updated Data:", updatedData);
  console.log("Changed By:", changedBy);

  if (!ProcurementId || !updatedData) {
    return res.status(400).json({
      success: false,
      message: "Procurement ID and updated data are required",
    });
  }

  try {
    const pendingUpdate = new PendingUpdate({
      ProcurementId,
      updatedData,
      changedBy,
    });

    const procurement = await Procurement.findById(ProcurementId);
    if (!procurement) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement not found" });
    }

    const supplier = await Suppliers.findById(procurement.supplierId);
    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }
    await sendProcurementUpdateEmail(
      supplier.Email,
      procurement.supplierName,
      procurement.companyName,
      procurement.PurchaseOrder
    );

    console.log("Procurement email sent");

    const savedUpdate = await pendingUpdate.save();
    res.status(201).json({ success: true, data: savedUpdate });
  } catch (error) {
    console.error("Error creating pending update:", error);
    res.status(500).json({
      success: false,
      message: "Error creating pending update",
      error: error.message,
    });
  }
};

// Get all pending updates
export const getAllPendingUpdates = async (req, res) => {
  try {
    const pendingUpdates = await PendingUpdate.find()
      .populate("ProcurementId", "PurchaseOrder")
      .populate("changedBy", "name");

    if (!pendingUpdates || pendingUpdates.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No updates found" });
    }

    res.status(200).json({ success: true, data: pendingUpdates });
  } catch (error) {
    console.error("Error fetching pending updates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending updates",
      error: error.message,
    });
  }
};

// Get a specific pending update by ID
export const getPendingUpdateById = async (req, res) => {
  try {
    const { purchaseOrder } = req.params; // כך מקבלים את הפרמטר
    // חיפוש PendingUpdate לפי השדה updatedData.PurchaseOrder
    const pendingUpdate = await PendingUpdate.findOne({
      "updatedData.PurchaseOrder": purchaseOrder,
    });

    if (!pendingUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Pending update not found" });
    }

    res.status(200).json({ success: true, data: pendingUpdate });
  } catch (error) {
    console.error("Error fetching pending update:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending update",
      error: error.message,
    });
  }
};

// Approve or reject a pending update
export const updatePendingUpdateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be either 'approved' or 'rejected'",
    });
  }

  try {
    const pendingUpdate = await PendingUpdate.findById(id);

    if (!pendingUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Pending update not found" });
    }

    pendingUpdate.status = status;

    if (status === "approved") {
      await Procurement.findByIdAndUpdate(
        pendingUpdate.ProcurementId,
        pendingUpdate.updatedData,
        { new: true, runValidators: true }
      );
    }

    const updatedPendingUpdate = await pendingUpdate.save();

    res.status(200).json({ success: true, data: updatedPendingUpdate });
  } catch (error) {
    console.error("Error updating pending update status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating pending update status",
      error: error.message,
    });
  }
};

// Delete a pending update
export const deletePendingUpdate = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUpdate = await PendingUpdate.findByIdAndDelete(id);

    if (!deletedUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Pending update not found" });
    }

    res.status(200).json({
      success: true,
      message: "Pending update deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pending update:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting pending update",
      error: error.message,
    });
  }
};
