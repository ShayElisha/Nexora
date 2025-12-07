import express from "express";
import {
  createContract,
  getAllContracts,
  getContractById,
  updateContract,
} from "../controllers/contract.controller.js";

const router = express.Router();

router.post("/", createContract);
router.get("/", getAllContracts);
router.get("/:id", getContractById);
router.put("/:id", updateContract);

export default router;

