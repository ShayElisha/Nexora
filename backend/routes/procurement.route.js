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
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createProcurementRecord);
router.get("/by/:purchaseOrder", getProcurementRecordById);
router.get("/", getAllProcurementRecords);
router.put("/:id", updateProcurementRecord);
router.delete("/:id", deleteProcurementRecord);
router.post("/:id/sign", signProcurement);
// Add this route to your procurement routes
router.get("/signatures", getEmployeeSignatures);
router.get("/all-signatures", getAllSignatures);
router.put("/:id/receive", receivedOrder);

export default router;
