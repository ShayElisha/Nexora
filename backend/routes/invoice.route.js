import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  markAsSent,
  updatePaymentStatus,
  getInvoiceStats,
  createInvoiceFromOrder,
  generateInvoicePDF,
  getAllInvoicesForSuperAdmin,
  getInvoiceStatsForSuperAdmin,
  createInvoiceForSuperAdmin,
  getInvoiceByIdForSuperAdmin,
  generateInvoicePDFForSuperAdmin,
} from "../controllers/invoice.controller.js";

const router = express.Router();

// Create invoice
router.post("/", createInvoice);

// Get all invoices
router.get("/", getInvoices);

// Get invoice statistics
router.get("/stats", getInvoiceStats);

// SuperAdmin endpoints (all companies) - must be before dynamic routes
router.get("/superadmin/all", getAllInvoicesForSuperAdmin);
router.get("/superadmin/stats", getInvoiceStatsForSuperAdmin);
router.post("/superadmin/create", createInvoiceForSuperAdmin);
router.get("/superadmin/:id", getInvoiceByIdForSuperAdmin);
router.get("/superadmin/:id/pdf", generateInvoicePDFForSuperAdmin);

// Create invoice from order
router.post("/from-order", createInvoiceFromOrder);

// Generate invoice PDF
router.get("/:id/pdf", generateInvoicePDF);

// Get single invoice
router.get("/:id", getInvoiceById);

// Update invoice
router.put("/:id", updateInvoice);

// Delete invoice
router.delete("/:id", deleteInvoice);

// Mark invoice as sent
router.put("/:id/send", markAsSent);

// Update payment status
router.put("/:id/payment", updatePaymentStatus);

export default router;

