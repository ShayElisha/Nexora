import express from "express";
import {
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controller.js";
// import { restrictToCompany } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", /*restrictToCompany,*/ createCustomer);
router.get("/:id", /*restrictToCompany,*/ getCustomerById);
router.put("/:id", /*restrictToCompany,*/ updateCustomer);
router.delete("/:id", /*restrictToCompany,*/ deleteCustomer);

export default router;
