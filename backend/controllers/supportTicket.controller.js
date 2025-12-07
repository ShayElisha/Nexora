import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import SupportTicket from "../models/supportTicket.model.js";
import Employee from "../models/employees.model.js";

/**
 * Create Support Ticket
 * יצירת כרטיס תמיכה חדש
 * מאפשר יצירת כרטיס גם ללא token עבור דיווחי באגים ציבוריים
 */
export const createSupportTicket = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    let companyId = null;
    let employeeId = null;
    let isPublicReport = false;

    // Try to get user info from token if available
    if (token) {
      try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        companyId = decodedToken.companyId;
        employeeId = decodedToken.employeeId || decodedToken.userId;
      } catch (tokenError) {
        // Token is invalid, treat as public report
        isPublicReport = true;
      }
    } else {
      // No token - public report
      isPublicReport = true;
    }

    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required",
      });
    }

    // For public reports, only allow Bug Report or General Question
    if (isPublicReport && category !== "Bug Report" && category !== "General Question") {
      return res.status(403).json({
        success: false,
        message: "Public reports are only allowed for Bug Report or General Question categories. Please log in for other categories.",
      });
    }

    // For authenticated users, require employeeId
    if (!isPublicReport && !employeeId) {
      return res
        .status(400)
        .json({ success: false, message: "Employee ID is required" });
    }

    // Create ticket - for public reports, companyId and createdBy will be null
    const ticketData = {
      title,
      description,
      category,
      priority: priority || "Medium",
      status: "Open",
    };

    // Only add companyId and createdBy if user is authenticated
    if (!isPublicReport) {
      ticketData.companyId = companyId;
      ticketData.createdBy = employeeId;
    }

    const ticket = await SupportTicket.create(ticketData);

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate("createdBy", "name email role")
      .populate("companyId", "name");

    return res.status(201).json({ success: true, data: populatedTicket });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating support ticket",
      error: error.message,
    });
  }
};

/**
 * Get Support Tickets
 * מחזיר את כל כרטיסי התמיכה של החברה (למנהל) או כל הכרטיסים (ל-SuperAdmin)
 */
export const getSupportTickets = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const userRole = decodedToken.role;

    // SuperAdmin רואה הכל
    let query = {};
    if (userRole !== "SuperAdmin") {
      query = { companyId };
    }

    const tickets = await SupportTicket.find(query)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("companyId", "name")
      .populate("comments.userId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching support tickets",
      error: error.message,
    });
  }
};

/**
 * Get Support Ticket By ID
 * מחזיר כרטיס תמיכה בודד לפי מזהה
 */
export const getSupportTicketById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const userRole = decodedToken.role;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ticket ID" });
    }

    let query = { _id: id };
    if (userRole !== "SuperAdmin") {
      query.companyId = companyId;
    }

    const ticket = await SupportTicket.findOne(query)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("companyId", "name")
      .populate("comments.userId", "name email role");

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found" });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching support ticket",
      error: error.message,
    });
  }
};

/**
 * Update Support Ticket
 * עדכון כרטיס תמיכה (סטטוס, הקצאה, וכו')
 */
export const updateSupportTicket = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const userRole = decodedToken.role;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ticket ID" });
    }

    let query = { _id: id };
    if (userRole !== "SuperAdmin") {
      query.companyId = companyId;
    }

    const ticket = await SupportTicket.findOne(query);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found" });
    }

    // עדכון סטטוס - אם משתנה ל-Resolved או Closed, נוסיף תאריך
    if (req.body.status) {
      if (req.body.status === "Resolved" && ticket.status !== "Resolved") {
        req.body.resolvedAt = new Date();
      }
      if (req.body.status === "Closed" && ticket.status !== "Closed") {
        req.body.closedAt = new Date();
      }
    }

    // מניעת עדכון שדות מסוימים
    delete req.body.companyId;
    delete req.body.createdBy;
    delete req.body._id;

    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("companyId", "name")
      .populate("comments.userId", "name email role");

    return res.status(200).json({ success: true, data: updatedTicket });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating support ticket",
      error: error.message,
    });
  }
};

/**
 * Add Comment to Support Ticket
 * הוספת תגובה לכרטיס תמיכה
 */
export const addComment = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const employeeId = decodedToken.employeeId || decodedToken.userId;
    const userRole = decodedToken.role;

    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "Comment is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ticket ID" });
    }

    let query = { _id: id };
    if (userRole !== "SuperAdmin") {
      query.companyId = companyId;
    }

    const ticket = await SupportTicket.findOne(query);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found" });
    }

    ticket.comments.push({
      userId: employeeId,
      comment,
    });

    await ticket.save();

    const updatedTicket = await SupportTicket.findById(id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("companyId", "name")
      .populate("comments.userId", "name email role");

    return res.status(200).json({ success: true, data: updatedTicket });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message,
    });
  }
};

/**
 * Delete Support Ticket
 * מחיקת כרטיס תמיכה (רק SuperAdmin או יוצר הכרטיס)
 */
export const deleteSupportTicket = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const employeeId = decodedToken.employeeId || decodedToken.userId;
    const userRole = decodedToken.role;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ticket ID" });
    }

    let query = { _id: id };
    if (userRole !== "SuperAdmin") {
      query.companyId = companyId;
      query.createdBy = employeeId; // רק יוצר הכרטיס יכול למחוק
    }

    const ticket = await SupportTicket.findOneAndDelete(query);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found or not authorized",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Support ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting support ticket:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting support ticket",
      error: error.message,
    });
  }
};

