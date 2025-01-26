// routes/signatureRoutes.js
import express from "express";
import {
  createSignature,
  addSignature,
  getSignatureStatus,
  getAllSignatureLists,
  deleteSignatureList,
} from "../controllers/signature.controller.js";

const router = express.Router();
router.get("/", getAllSignatureLists);

// יצירת הרשאה חדשה
router.post("/create", createSignature);

// הוספת חתימה לפי סדר
router.post("/add", addSignature);

// קבלת סטטוס תעודה
router.get("/status/:certificateId", getSignatureStatus);
router.delete("/:id", deleteSignatureList);

export default router;
