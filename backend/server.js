import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";

// Import route files
import companyRoutes from "./routes/companies.route.js";
import nexoraRoutes from "./routes/nexora.route.js";
import authRoutes from "./routes/auth.route.js";
import superAdminRoutes from "./routes/superAdmin.route.js";
import paymentRoutes from "./routes/payment.route.js";
import procurementRoutes from "./routes/procurement.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import supplierRoutes from "./routes/suppliers.route.js";
import FinanceRoutes from "./routes/finance.route.js";
import employeeRoutes from "./routes/employees.route.js";
import productsRoutes from "./routes/product.route.js";
import signatureRoutes from "./routes/signature.route.js";
import notificationRoutes from "./routes/notification.route.js";
import updateProcurementRoute from "./routes/UpdateProcurement.route.js";
import budgetRoutes from "./routes/budget.route.js";
import eventsRoutes from "./routes/events.route.js";
import taskRouter from "./routes/tasks.route.js";
import departmentRouter from "./routes/department.route.js";
import reportsRouter from "./routes/reports.routes.js";
import productTreeRoutes from "./routes/productTree.routes.js";
import projectRoutes from "./routes/project.route.js";
import customerRoutes from "./routes/customers.route.js";
import CustomerOrderRoutes from "./routes/CustomerOrder.route.js";
import ProcurementProposalRoutes from "./routes/ProcurementProposal.route.js";
import PerformanceReviewRoutes from "./routes/performanceReview.route.js";
import chatRoutes from "./routes/chat.route.js";
import shiftsRoutes from "./routes/Shifts.route.js";
import payRateRoute from "./routes/payRate.route.js";
import salaryRoute from "./routes/salary.route.js";
import taxConfigRoutes from "./routes/TaxConfig.route.js";
import sickDaysRoutes from "./routes/SickDays.route.js";
import aiRoutes from "./Ai/ai.routes.js";
import analyticsRoutes from "./routes/analytics.route.js";
import supportTicketRoutes from "./routes/supportTicket.route.js";
import invoiceRoutes from "./routes/invoice.route.js";
import permissionRoutes from "./routes/permission.route.js";
import roleRoutes from "./routes/role.route.js";
import deliveryTrackingRoutes from "./routes/deliveryTracking.route.js";
import payrollAutomationRoutes from "./routes/payrollAutomation.route.js";
import leadsRoutes from "./routes/leads.route.js";
import activitiesRoutes from "./routes/activities.route.js";
import leadsAnalyticsRoutes from "./routes/leadsAnalytics.route.js";
import productionOrderRoutes from "./routes/ProductionOrder.route.js";
import warehouseRoutes from "./routes/warehouse.route.js";
import assetRoutes from "./routes/asset.route.js";
import accountingRoutes from "./routes/accounting.route.js";
import bankRoutes from "./routes/bank.route.js";
import salesRoutes from "./routes/sales.route.js";
import contractRoutes from "./routes/contract.route.js";
import customerServiceRoutes from "./routes/customerService.route.js";
import inventoryAdvancedRoutes from "./routes/inventoryAdvanced.route.js";
import procurementAdvancedRoutes from "./routes/procurementAdvanced.route.js";
import atsRoutes from "./routes/ats.route.js";
import lmsRoutes from "./routes/lms.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import leaveRoutes from "./routes/leave.route.js";
import hrAnalyticsRoutes from "./routes/hrAnalytics.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to the database and add performance indexes
import { addPerformanceIndexes } from "./config/addIndexes.js";

connectDB().then(async () => {
  // הוספת indexes לשיפור ביצועים (רק בהפעלה ראשונה)
  try {
    await addPerformanceIndexes();
  } catch (error) {
    console.error("Error adding indexes (non-critical):", error.message);
  }
});

// IMPORTANT: Webhook route MUST be before express.json() middleware
// Stripe webhooks require raw body for signature verification
import { handleStripeWebhook } from "./controllers/payment.controller.js";
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Middleware to parse JSON requests
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" })); // הגדל את הגבול לפי הצורך
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
// API routes
app.use("/api/auth", authRoutes);
app.use("/api/superAdmin", superAdminRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/companies", nexoraRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/finance", FinanceRoutes);
app.use("/api/product", productsRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/updateProcurement", updateProcurementRoute);
app.use("/api/budget", budgetRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/tasks", taskRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/product-trees", productTreeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/CustomerOrder", CustomerOrderRoutes);
app.use("/api/proposals", ProcurementProposalRoutes);
app.use("/api/PerformanceReview", PerformanceReviewRoutes);
app.use("/api/chatAi", chatRoutes);
app.use("/api/shifts", shiftsRoutes);
app.use("/api/payRate", payRateRoute);
app.use("/api/salary", salaryRoute);
app.use("/api/tax-config", taxConfigRoutes);
app.use("/api/payroll-automation", payrollAutomationRoutes);
app.use("/api/sickDays", sickDaysRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/delivery-tracking", deliveryTrackingRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/leads/analytics", leadsAnalyticsRoutes);
app.use("/api/production-orders", productionOrderRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/customer-service", customerServiceRoutes);
app.use("/api/inventory-advanced", inventoryAdvancedRoutes);
app.use("/api/procurement-advanced", procurementAdvancedRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/lms", lmsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/hr/analytics", hrAnalyticsRoutes);

app.post("/save-pdf", (req, res) => {
  const { pdfData, fileName } = req.body;

  if (!pdfData || !fileName) {
    return res
      .status(400)
      .json({ message: "PDF data and file name are required." });
  }

  const filePath = path.join(__dirname, "uploads", fileName);

  const buffer = Buffer.from(pdfData, "base64");
  fs.writeFileSync(filePath, buffer);

  res.status(200).json({ url: `/uploads/${fileName}` });
});

// Load existing cron jobs
import "./CronJob.js";

// Error handling middleware (must be last)
import { errorHandler } from "./middleware/errorHandler.js";
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
