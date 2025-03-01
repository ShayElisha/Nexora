import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "attachments", maxCount: 10 },
  ]),
  createProduct
);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
