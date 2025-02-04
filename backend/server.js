import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import route files
import companyRoutes from "./routes/companies.route.js";
import nexoraRoutes from "./routes/nexora.route.js";
import authRoutes from "./routes/auth.route.js";
import paymentRoutes from "./routes/payment.route.js";
import productRoutes from "./routes/procurement.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import supplierRoutes from "./routes/suppliers.route.js";
import FinanceRoutes from "./routes/finance.route.js";
import employeeRoutes from "./routes/employees.route.js";
import procurementRoutes from "./routes/procurement.route.js";
import signatureRoutes from "./routes/signature.route.js";
import notificationRoutes from "./routes/notification.route.js";
import updateProcurementRoute from "./routes/UpdateProcurement.route.js";
import budgetRoutes from "./routes/budget.route.js";
import productsRoutes from "./routes/product.route.js";
import eventsRoutes from "./routes/events.route.js";
import taskRouter from "./routes/tasks.route.js";
import departmentRouter from "./routes/department.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

// Middleware to parse JSON requests
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json()); // Parse JSON requests req.body
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/companies", nexoraRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/finance", FinanceRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/updateProcurement", updateProcurementRoute);
app.use("/api/budget", budgetRoutes);
app.use("/api/product", productsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/tasks", taskRouter);
app.use("/api/departments", departmentRouter);

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

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
