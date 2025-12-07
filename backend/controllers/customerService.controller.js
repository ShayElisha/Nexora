import CustomerServiceTicket from "../models/CustomerServiceTicket.model.js";
import jwt from "jsonwebtoken";

const verifyToken = (req) => {
  const token = req.cookies?.auth_token;
  if (!token) throw new Error("Unauthorized: No token provided");
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Generate Ticket Number
const generateTicketNumber = async (companyId) => {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}-`;
  const lastTicket = await CustomerServiceTicket.findOne({
    companyId,
    ticketNumber: new RegExp(`^${prefix}`),
  })
    .sort({ ticketNumber: -1 })
    .limit(1);
  let sequence = 1;
  if (lastTicket) {
    const lastSeq = parseInt(lastTicket.ticketNumber.split("-")[2] || "0");
    sequence = lastSeq + 1;
  }
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

// Create Service Ticket
export const createServiceTicket = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const ticketNumber = await generateTicketNumber(decoded.companyId);
    const ticket = new CustomerServiceTicket({
      ...req.body,
      companyId: decoded.companyId,
      ticketNumber,
    });
    await ticket.save();
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Service Tickets
export const getAllServiceTickets = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { status, priority, assignedTo, customerId } = req.query;
    const filter = { companyId: decoded.companyId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (customerId) filter.customerId = customerId;

    const tickets = await CustomerServiceTicket.find(filter)
      .populate("customerId", "name email")
      .populate("assignedTo", "name lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Service Ticket
export const updateServiceTicket = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { id } = req.params;
    const ticket = await CustomerServiceTicket.findOneAndUpdate(
      { _id: id, companyId: decoded.companyId },
      req.body,
      { new: true }
    );
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

