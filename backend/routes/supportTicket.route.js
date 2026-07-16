import express from "express";
import {
  createSupportTicket,
  getSupportTickets,
  getAllSupportTicketsForSuperAdmin,
  getSupportTicketById,
  updateSupportTicket,
  addComment,
  deleteSupportTicket,
} from "../controllers/supportTicket.controller.js";

const router = express.Router();

// יצירת כרטיס תמיכה חדש
router.post("/", createSupportTicket);

// SuperAdmin panel — list all tickets without Nexora employee session
router.get("/superadmin/all", getAllSupportTicketsForSuperAdmin);

// קבלת כל כרטיסי התמיכה
router.get("/", getSupportTickets);

// קבלת כרטיס תמיכה לפי מזהה
router.get("/:id", getSupportTicketById);

// עדכון כרטיס תמיכה
router.put("/:id", updateSupportTicket);

// הוספת תגובה לכרטיס תמיכה
router.post("/:id/comments", addComment);

// מחיקת כרטיס תמיכה
router.delete("/:id", deleteSupportTicket);

export default router;

