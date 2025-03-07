import express from "express";
import multer from "multer";
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

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "attachments") {
      cb(null, true);
    } else {
      cb(null, true);
    }
  },
});

router.put(
  "/:id",
  upload.fields([{ name: "attachments", maxCount: 10 }]),
  updateSupplier
);
// שאר הנתיבים
router.post(
  "/",
  upload.fields([
    { name: "confirmationAccount", maxCount: 1 },
    { name: "attachments", maxCount: 10 },
  ]),
  createSupplier
);
router.get("/", getAllSuppliers);
router.get("/:id", getSupplierById);
router.delete("/:id", deleteSupplier);
router.put("/:supplierId/products", addProductToSupplier);
router.put("/approve-update/:PurchaseOrder", approveUpdateProcurement);
router.put("/reject-update/:PurchaseOrder", rejectUpdateProcurement);

export default router;
