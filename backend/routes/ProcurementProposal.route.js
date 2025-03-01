import express from "express";
import {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
} from "../controllers/ProcurementProposal.controller.js";

const router = express.Router();

router.get("/", getProposals);
router.get("/all", getProposal);
router.post("/", createProposal);
router.put("/:id", updateProposal);
router.delete("/:id", deleteProposal);

export default router;
