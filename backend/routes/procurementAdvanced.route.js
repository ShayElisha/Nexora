import express from "express";
import {
  createPurchaseRequest,
  getAllPurchaseRequests,
  createTender,
  getAllTenders,
  createSupplierContract,
  getAllSupplierContracts,
  createPriceList,
  getAllPriceLists,
  getPriceListById,
  updatePriceList,
  deletePriceList,
  getPriceFromPriceList,
  createSupplierInvoice,
  getAllSupplierInvoices,
  getSupplierInvoice,
  updateSupplierInvoice,
  deleteSupplierInvoice,
  sendSupplierInvoiceEmail,
  createSupplySchedule,
  getAllSupplySchedules,
  getSupplyScheduleById,
  updateSupplySchedule,
  deleteSupplySchedule,
  updateSupplyScheduleStatus,
  duplicateSupplySchedule,
  getSupplyScheduleStats,
} from "../controllers/procurementAdvanced.controller.js";

const router = express.Router();

// Purchase Request Routes
router.post("/purchase-requests", createPurchaseRequest);
router.get("/purchase-requests", getAllPurchaseRequests);

// Tender Routes
router.post("/tenders", createTender);
router.get("/tenders", getAllTenders);

// Supplier Contract Routes
router.post("/supplier-contracts", createSupplierContract);
router.get("/supplier-contracts", getAllSupplierContracts);

// Price List Routes
router.post("/price-lists", createPriceList);
router.get("/price-lists", getAllPriceLists);
// IMPORTANT: get-price must come BEFORE /:id to avoid route conflict
router.get("/price-lists/get-price", getPriceFromPriceList);
router.get("/price-lists/:id", getPriceListById);
router.put("/price-lists/:id", updatePriceList);
router.delete("/price-lists/:id", deletePriceList);

// Supplier Invoice Routes
router.post("/supplier-invoices", createSupplierInvoice);
router.get("/supplier-invoices", getAllSupplierInvoices);
router.get("/supplier-invoices/:id", getSupplierInvoice);
router.put("/supplier-invoices/:id", updateSupplierInvoice);
router.delete("/supplier-invoices/:id", deleteSupplierInvoice);
router.post("/supplier-invoices/:id/send-email", sendSupplierInvoiceEmail);

// Supply Schedule Routes
router.post("/supply-schedules", createSupplySchedule);
router.get("/supply-schedules", getAllSupplySchedules);
router.get("/supply-schedules/stats", getSupplyScheduleStats);
router.get("/supply-schedules/:id", getSupplyScheduleById);
router.put("/supply-schedules/:id", updateSupplySchedule);
router.delete("/supply-schedules/:id", deleteSupplySchedule);
router.patch("/supply-schedules/:id/status", updateSupplyScheduleStatus);
router.post("/supply-schedules/:id/duplicate", duplicateSupplySchedule);

export default router;

