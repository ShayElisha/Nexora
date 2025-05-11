import express from "express";
import {
  createPolicy,
  getAllPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
} from "../controllers/SickDays.controller.js";

const router = express.Router();

router.post("/", createPolicy);
router.get("/", getAllPolicies);
router.get("/:id", getPolicyById);
router.put("/:id", updatePolicy);
router.delete("/:id", deletePolicy);

export default router;
