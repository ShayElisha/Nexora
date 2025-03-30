import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProductByName,
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
router.get("/search-by-name", searchProductByName);

router.get("/", getProducts);
router.get("/:id", getProductById);
router.put(
  "/:id",
  upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "attachments", maxCount: 10 },
  ]),
  updateProduct
);
router.delete("/:id", deleteProduct);

export default router;
