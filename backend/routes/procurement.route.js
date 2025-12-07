import express from "express";
import {
  createProcurementRecord,
  getAllProcurementRecords,
  updateProcurementRecord,
  getProcurementRecordById,
  deleteProcurementRecord,
  signProcurement,
  getEmployeeSignatures,
  getAllSignatures,
  receivedOrder,
} from "../controllers/procurement.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createProcurementRecord);
router.get("/", getAllProcurementRecords);
router.get("/signatures", getEmployeeSignatures);
router.get("/all-signatures", getAllSignatures);
router.get("/by/:purchaseOrder", getProcurementRecordById);
// Specific routes before /:id
router.put("/:id/receive", receivedOrder);
router.post("/:id/sign", signProcurement);
router.post("/:id/prepare", protectRoute, async (req, res) => {
  try {
    const Procurement = (await import("../models/procurement.model.js")).default;
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) {
      return res.status(404).json({ success: false, message: "Procurement not found" });
    }
    procurement.preparationStatus = "In Progress";
    procurement.preparationDate = new Date();
    await procurement.save();
    res.json({ success: true, data: procurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.post("/:id/ready-to-ship", protectRoute, async (req, res) => {
  try {
    const Procurement = (await import("../models/procurement.model.js")).default;
    const procurement = await Procurement.findById(req.params.id);
    if (!procurement) {
      return res.status(404).json({ success: false, message: "Procurement not found" });
    }
    procurement.preparationStatus = "Ready to Ship";
    await procurement.save();
    res.json({ success: true, data: procurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Get by ID - must be last
router.get("/:id", async (req, res) => {
  try {
    const Procurement = (await import("../models/procurement.model.js")).default;
    const procurement = await Procurement.findById(req.params.id)
      .populate("supplierId")
      .populate("companyId");
    if (!procurement) {
      return res.status(404).json({ success: false, message: "Procurement not found" });
    }
    res.json({ success: true, data: procurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put("/:id", updateProcurementRecord);
router.delete("/:id", deleteProcurementRecord);

export default router;
