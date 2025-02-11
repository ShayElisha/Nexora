import express from "express";
import {
  createProductTree,
  getAllProductTrees,
  getProductTreeById,
  updateProductTree,
  deleteProductTree,
} from "../controllers/productTree.controller.js";

const router = express.Router();

router.route("/").post(createProductTree).get(getAllProductTrees);
router.route("/:id").get(getProductTreeById).put(updateProductTree).delete(deleteProductTree);

export default router;
