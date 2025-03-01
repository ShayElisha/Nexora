import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controller.js";

const router = express.Router();

// יצירת לקוח חדש
router.post("/", createCustomer);

// שליפת כל הלקוחות
router.get("/", getAllCustomers);

// שליפת לקוח לפי מזהה
router.get("/:id", getCustomerById);

// עדכון לקוח לפי מזהה
router.put("/:id", updateCustomer);

// מחיקת לקוח לפי מזהה
router.delete("/:id", deleteCustomer);

export default router;
