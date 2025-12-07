import express from "express";
import * as salaryController from "../controllers/salary.controller.js";

const router = express.Router();

router.post("/", salaryController.createSalary);
router.get("/", salaryController.getAllSalaries);
router.get("/my-salary", salaryController.getMySalaries);
router.get("/:id", salaryController.getSalaryById);
router.put("/:id", salaryController.updateSalary);
router.delete("/:id", salaryController.deleteSalary);
router.post(
  "/calculate-and-update-taxes",
  salaryController.calculateAndUpdateSalaryTaxes
);
router.post(
  "/calculate-taxes-for-month",
  salaryController.calculateTaxesForMonthWithTax
);
router.post(
  "/send-payslip-emails",
  salaryController.sendPayslipEmails
);

export default router;
