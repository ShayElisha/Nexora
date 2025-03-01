import express from "express";
import {
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrderById,
  updateCustomerOrder,
  deleteCustomerOrder,
  getUnallocatedOrders,
} from "../controllers/CustomerOrder.controller.js";

const router = express.Router();

// Create a new customer order
router.post("/", createCustomerOrder);

// Get all customer orders
router.get("/", getCustomerOrders);

// Get a single customer order by its ID
router.get("/:id", getCustomerOrderById);

// Update an existing customer order
router.put("/:id", updateCustomerOrder);

// Delete a customer order by its ID
router.delete("/:id", deleteCustomerOrder);

router.get("/unallocated", getUnallocatedOrders);

export default router;
