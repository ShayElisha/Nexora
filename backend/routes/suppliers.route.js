import express from "express";
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  addProductToSupplier,
  approveUpdateProcurement,
  rejectUpdateProcurement,
} from "../controllers/suppliers.controller.js";
//import { restrictToCompany } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.put("/approve-update/:PurchaseOrder", approveUpdateProcurement);
router.put("/reject-update/:PurchaseOrder", rejectUpdateProcurement);

router.post("/", createSupplier);
router.get("/", getAllSuppliers);
router.get("/:id", /*restrictToCompany,*/ getSupplierById);
router.put("/:id", /*restrictToCompany,*/ updateSupplier);
router.delete("/:id", /*restrictToCompany,*/ deleteSupplier);
router.put("/:supplierId/products", addProductToSupplier);

export default router;
