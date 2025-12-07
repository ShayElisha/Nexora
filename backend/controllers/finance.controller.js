import Finance from "../models/finance.model.js";
import Budget from "../models/Budget.model.js";
import Notification from "../models/notification.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { uploadToCloudinaryFile } from "../config/lib/cloudinary.js";
import SupplierInvoice from "../models/SupplierInvoice.model.js";
import Supplier from "../models/suppliers.model.js";

export const createFinanceRecord = async (req, res) => {
  const {
    transactionDate,
    transactionType,
    transactionAmount,
    transactionCurrency,
    transactionDescription,
    category,
    bankAccount,
    transactionStatus,
    recordType, // supplier, employee, customer, other
    supplierId,
    employeeId,
    customerId,
    otherDetails,
    invoiceNumber,
    paymentTerms,
    budgetId, // קישור לתקציב
    budgetCategory, // קטגוריה מהתקציב
  } = req.body;

  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decodedToken.companyId;

  // בדיקת ולידציה לשדות נדרשים
  if (
    !transactionDate ||
    !transactionType ||
    !transactionAmount ||
    !transactionCurrency ||
    !category ||
    !bankAccount ||
    !transactionStatus
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided.",
    });
  }

  // מיפוי שדות דינמיים לפי סוג הרשומה
  let partyId = null;
  if (recordType === "supplier") {
    partyId = supplierId;
  } else if (recordType === "employee") {
    partyId = employeeId;
  } else if (recordType === "customer") {
    partyId = customerId;
  }

  // טיפול במספר קבצים מצורפים – העלאה ל־Cloudinary
  let attachmentURLs = [];
  if (req.files && req.files.length > 0) {
    try {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinaryFile(file.buffer.toString("base64"))
      );
      const uploadResults = await Promise.all(uploadPromises);
      attachmentURLs = uploadResults.map((result) => result.secure_url);
    } catch (uploadError) {
      console.error("Error uploading files:", uploadError.message);
      return res.status(500).json({
        success: false,
        message: "Error uploading files",
        error: uploadError.message,
      });
    }
  } else if (req.body.attachment) {
    attachmentURLs = [req.body.attachment];
  }

  try {
    const newFinanceRecord = new Finance({
      companyId,
      transactionDate,
      transactionType,
      transactionAmount,
      transactionCurrency,
      transactionDescription,
      category,
      bankAccount,
      transactionStatus,
      recordType,
      partyId, // שמירת המזהה המאוחד לפי סוג הרשומה
      attachmentURL: attachmentURLs,
      invoiceNumber,
      paymentTerms: paymentTerms || "Net 30",
      budgetId,
      budgetCategory,
      // ניתן לשמור גם otherDetails במקרה הצורך
    });

    const savedFinanceRecord = await newFinanceRecord.save();

    // עדכון תקציב אם קיים קישור
    if (budgetId && transactionType === "Expense") {
      try {
        const budget = await Budget.findById(budgetId);
        if (budget) {
          // עדכון סכום ההוצאות
          budget.spentAmount = (budget.spentAmount || 0) + transactionAmount;
          
          // הוספת Finance Record לרשימה
          if (!budget.financeRecords) {
            budget.financeRecords = [];
          }
          budget.financeRecords.push(savedFinanceRecord._id);
          
          // בדיקת חריגה מתקציב
          const budgetPercentage = (budget.spentAmount / budget.amount) * 100;
          
          if (budget.spentAmount > budget.amount) {
            // יצירת התראה על חריגה
            await Notification.create({
              companyId,
              type: "budget_exceeded",
              title: "תקציב חרג",
              content: `התקציב "${budget.departmentOrProjectName}" חרג. סכום הוצאות: ${budget.spentAmount} ${budget.currency}, תקציב: ${budget.amount} ${budget.currency}`,
              priority: "high",
              relatedEntity: {
                type: "Budget",
                id: budget._id,
              },
            });
          } else if (budgetPercentage >= 90) {
            // התראה על התקרבות לתקציב (90%+)
            await Notification.create({
              companyId,
              type: "budget_warning",
              title: "התקרבות לתקציב",
              content: `התקציב "${budget.departmentOrProjectName}" הגיע ל-${budgetPercentage.toFixed(1)}%. סכום נותר: ${budget.amount - budget.spentAmount} ${budget.currency}`,
              priority: "medium",
              relatedEntity: {
                type: "Budget",
                id: budget._id,
              },
            });
          }
          
          await budget.save();
        }
      } catch (budgetError) {
        console.error("Error updating budget:", budgetError.message);
        // לא נכשל את כל הבקשה אם יש בעיה בעדכון התקציב
      }
    }

    res.status(201).json({ success: true, data: savedFinanceRecord });
  } catch (error) {
    console.error("Error creating finance record:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating finance record",
      error: error.message,
    });
  }
};

// Pull all finance records
export const getAllFinanceRecords = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    console.error("Token is missing in request headers.");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let companyId;

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    companyId = decodedToken?.companyId;
    if (!companyId) {
      console.error("Invalid token: Missing companyId");
      return res.status(400).json({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }

  try {
    const financeRecords = await Finance.find({ companyId })
      .populate("companyId", "CompanyName")
      .populate("partyId");

    console.log("Finance records fetched successfully:", financeRecords);
    res.status(200).json({ success: true, data: financeRecords });
  } catch (error) {
    console.error("Error retrieving finance records:", error.message);
    res.status(500).json({
      success: false,
      message: "Error retrieving finance records",
      error: error.message,
    });
  }
};

// Pull finance record by id
export const getFinanceRecordById = async (req, res) => {
  try {
    const financeRecord = await Finance.find()
      .populate("companyId", "CompanyName")
      .populate("partyId");
    if (!financeRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Finance record not found" });
    }
    res.status(200).json({ success: true, data: financeRecord });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving finance record",
      error: error.message,
    });
  }
};

// Update finance record by allowed fields
export const updateFinanceRecord = async (req, res) => {
  const updates = req.body;
  const allowedUpdates = [
    "transactionDate",
    "transactionType",
    "transactionAmount",
    "transactionCurrency",
    "transactionDescription",
    "category",
    "bankAccount",
    "transactionStatus",
    "supplierId",
    "supplierName",
    "attachmentURL",
    "invoiceNumber",
    "paymentTerms",
    "otherDetails",
  ];

  // בדיקת ולידציה לשדות מותרים לעדכון
  const isValidUpdate = Object.keys(updates).every((key) =>
    allowedUpdates.includes(key)
  );
  if (!isValidUpdate) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid update fields." });
  }

  try {
    console.log("📝 Updating finance record:", req.params.id);
    console.log("📝 Update data:", updates);

    // Get existing record to calculate dueDate if needed
    const existingRecord = await Finance.findById(req.params.id);
    if (!existingRecord) {
      console.error("❌ Finance record not found:", req.params.id);
      return res
        .status(404)
        .json({ success: false, message: "Finance record not found" });
    }

    // Convert transactionDate to Date if it's a string
    if (updates.transactionDate && typeof updates.transactionDate === 'string') {
      updates.transactionDate = new Date(updates.transactionDate);
    }

    // Calculate dueDate if transactionDate or paymentTerms are being updated
    if (updates.transactionDate || updates.paymentTerms) {
      const transactionDate = updates.transactionDate || existingRecord.transactionDate;
      const paymentTerms = updates.paymentTerms || existingRecord.paymentTerms;
      
      if (transactionDate && paymentTerms) {
        if (paymentTerms === "Immediate") {
          updates.dueDate = transactionDate instanceof Date ? transactionDate : new Date(transactionDate);
        } else {
          const daysToAdd = paymentTerms === "Net 30" ? 30 :
                            paymentTerms === "Net 45" ? 45 :
                            paymentTerms === "Net 60" ? 60 :
                            paymentTerms === "Net 90" ? 90 : 30;
          
          const dateObj = transactionDate instanceof Date ? transactionDate : new Date(transactionDate);
          const dueDate = new Date(dateObj);
          dueDate.setDate(dueDate.getDate() + daysToAdd);
          updates.dueDate = dueDate;
        }
      }
    }

    // Remove empty strings and null values
    Object.keys(updates).forEach(key => {
      if (updates[key] === '' || updates[key] === null) {
        delete updates[key];
      }
    });

    const updatedFinanceRecord = await Finance.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("companyId", "CompanyName")
      .populate("partyId");

    if (!updatedFinanceRecord) {
      console.error("❌ Finance record not found after update:", req.params.id);
      return res
        .status(404)
        .json({ success: false, message: "Finance record not found" });
    }

    // יצירת חשבונית ספק אוטומטית כאשר מאשרים תשלום ספק
    if (
      updatedFinanceRecord.transactionStatus === "Completed" &&
      updatedFinanceRecord.recordType === "supplier" &&
      updatedFinanceRecord.partyId &&
      existingRecord.transactionStatus !== "Completed" // רק אם זה שינוי חדש ל-Completed
    ) {
      try {
        console.log("🔄 Creating supplier invoice automatically for approved payment...");
        
        // קבלת פרטי הספק
        const supplier = await Supplier.findById(updatedFinanceRecord.partyId);
        if (!supplier) {
          console.warn("⚠️ Supplier not found, skipping invoice creation");
        } else {
          // יצירת מספר חשבונית
          const year = new Date().getFullYear();
          const prefix = `SI-${year}-`;
          const lastInvoice = await SupplierInvoice.findOne({
            companyId: updatedFinanceRecord.companyId,
            invoiceNumber: new RegExp(`^${prefix}`),
          })
            .sort({ invoiceNumber: -1 })
            .limit(1);
          
          let sequence = 1;
          if (lastInvoice) {
            const lastSeq = parseInt(lastInvoice.invoiceNumber.split("-")[2] || "0");
            sequence = lastSeq + 1;
          }
          const invoiceNumber = `${prefix}${sequence.toString().padStart(6, "0")}`;

          // חישוב תאריכים
          const invoiceDate = updatedFinanceRecord.transactionDate || new Date();
          const dueDate = updatedFinanceRecord.dueDate || new Date(invoiceDate);
          if (!updatedFinanceRecord.dueDate) {
            // אם אין dueDate, נחשב לפי paymentTerms
            const paymentTerms = updatedFinanceRecord.paymentTerms || "Net 30";
            const daysToAdd = paymentTerms === "Immediate" ? 0 :
                            paymentTerms === "Net 30" ? 30 :
                            paymentTerms === "Net 45" ? 45 :
                            paymentTerms === "Net 60" ? 60 :
                            paymentTerms === "Net 90" ? 90 : 30;
            dueDate.setDate(dueDate.getDate() + daysToAdd);
          }

          // חישוב סכומים
          const subtotal = updatedFinanceRecord.transactionAmount || 0;
          const taxAmount = subtotal * 0.17; // 17% מע"מ
          const totalAmount = subtotal + taxAmount;

          // יצירת חשבונית ספק
          const supplierInvoice = new SupplierInvoice({
            companyId: updatedFinanceRecord.companyId,
            invoiceNumber,
            supplierInvoiceNumber: updatedFinanceRecord.invoiceNumber || invoiceNumber,
            supplierId: updatedFinanceRecord.partyId,
            supplierName: supplier.SupplierName || supplier.name || "Unknown Supplier",
            invoiceDate,
            dueDate,
            receivedDate: invoiceDate,
            items: [
              {
                productName: updatedFinanceRecord.transactionDescription || "Payment for supplier services",
                description: updatedFinanceRecord.transactionDescription || "Payment approved from finance",
                quantity: 1,
                unitPrice: subtotal,
                discount: 0,
                tax: 17,
                totalPrice: subtotal,
              },
            ],
            subtotal,
            taxAmount,
            discountAmount: 0,
            totalAmount,
            remainingAmount: 0, // שולם במלואו כי התשלום כבר אושר
            currency: updatedFinanceRecord.transactionCurrency || "ILS",
            status: "Paid", // מכיוון שהתשלום כבר אושר
            paymentTerms: updatedFinanceRecord.paymentTerms === "Net 30" ? "Net 30" :
                         updatedFinanceRecord.paymentTerms === "Net 45" ? "Net 30" : // Net 45 לא קיים ב-SupplierInvoice, נשתמש ב-Net 30
                         updatedFinanceRecord.paymentTerms === "Net 60" ? "Net 60" :
                         updatedFinanceRecord.paymentTerms === "Net 90" ? "Net 90" :
                         updatedFinanceRecord.paymentTerms === "Immediate" ? "Immediate" : "Net 30",
            notes: `Created automatically from approved finance payment. Finance Record ID: ${updatedFinanceRecord._id}`,
            payments: [
              {
                paymentDate: invoiceDate,
                amount: totalAmount,
                paymentMethod: "Bank Transfer",
                reference: updatedFinanceRecord.invoiceNumber || invoiceNumber,
              },
            ],
            totalPaid: totalAmount,
          });

          await supplierInvoice.save();
          console.log("✅ Supplier invoice created successfully:", supplierInvoice.invoiceNumber);
        }
      } catch (invoiceError) {
        console.error("❌ Error creating supplier invoice:", invoiceError);
        // לא נכשל את כל התהליך אם יש שגיאה ביצירת חשבונית
      }
    }

    console.log("✅ Finance record updated successfully:", updatedFinanceRecord._id);
    res.status(200).json({ success: true, data: updatedFinanceRecord });
  } catch (error) {
    console.error("❌ Error updating finance record:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error updating finance record",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Delete a finance record by id
export const deleteFinanceRecord = async (req, res) => {
  try {
    const deletedFinanceRecord = await Finance.findByIdAndDelete(req.params.id);
    if (!deletedFinanceRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Finance record not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Finance record deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting finance record",
      error: error.message,
    });
  }
};

/**
 * Get Cash Flow Analysis by period (daily, weekly, monthly, quarterly)
 */
export const getCashFlowAnalysis = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // Convert companyId to ObjectId if needed
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      companyId = new mongoose.Types.ObjectId(companyId);
    }

    const { period = "monthly", startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    // Check if there are any finance records at all
    const totalRecords = await Finance.countDocuments({ companyId });
    const completedRecords = await Finance.countDocuments({ 
      companyId, 
      transactionStatus: "Completed" 
    });

    const matchFilter = {
      companyId,
      transactionStatus: "Completed", // Only completed transactions
      ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter }),
    };

    // Group by period
    let groupFormat = {};
    switch (period) {
      case "daily":
        groupFormat = {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
          day: { $dayOfMonth: "$transactionDate" },
        };
        break;
      case "weekly":
        groupFormat = {
          year: { $year: "$transactionDate" },
          week: { $week: "$transactionDate" },
        };
        break;
      case "quarterly":
        groupFormat = {
          year: { $year: "$transactionDate" },
          quarter: {
            $ceil: { $divide: [{ $month: "$transactionDate" }, 3] },
          },
        };
        break;
      case "monthly":
      default:
        groupFormat = {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
        };
        break;
    }

    console.log("Cash Flow Analysis - Match Filter:", JSON.stringify(matchFilter, null, 2));
    
    const cashFlowData = await Finance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            ...groupFormat,
            type: "$transactionType",
          },
          total: { $sum: "$transactionAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.quarter": 1,
          "_id.week": 1,
          "_id.day": 1,
        },
      },
    ]);

    console.log("Cash Flow Analysis - Raw Data Count:", cashFlowData.length);
    console.log("Cash Flow Analysis - Sample Data:", JSON.stringify(cashFlowData.slice(0, 3), null, 2));

    // Process data for frontend - group by period (without type)
    const processedData = {};
    cashFlowData.forEach((item) => {
      // Create key without type
      const periodKey = JSON.stringify({
        year: item._id.year,
        month: item._id.month || null,
        day: item._id.day || null,
        week: item._id.week || null,
        quarter: item._id.quarter || null,
      });
      
      if (!processedData[periodKey]) {
        processedData[periodKey] = {
          period: {
            year: item._id.year,
            month: item._id.month || null,
            day: item._id.day || null,
            week: item._id.week || null,
            quarter: item._id.quarter || null,
          },
          income: 0,
          expense: 0,
          transfer: 0,
          count: 0,
        };
      }
      
      if (item._id.type === "Income") {
        processedData[periodKey].income += item.total;
      } else if (item._id.type === "Expense") {
        processedData[periodKey].expense += item.total;
      } else if (item._id.type === "Transfer") {
        processedData[periodKey].transfer += item.total;
      }
      
      processedData[periodKey].count += item.count;
      processedData[periodKey].netCashFlow =
        processedData[periodKey].income - processedData[periodKey].expense;
    });

    const result = Object.values(processedData).map((item) => {
      let periodLabel = "";
      if (period === "daily" && item.period.day && item.period.month) {
        periodLabel = `${item.period.day}/${item.period.month}/${item.period.year}`;
      } else if (period === "weekly" && item.period.week) {
        periodLabel = `Week ${item.period.week}/${item.period.year}`;
      } else if (period === "quarterly" && item.period.quarter) {
        periodLabel = `Q${item.period.quarter}/${item.period.year}`;
      } else if (item.period.month) {
        periodLabel = `${item.period.month}/${item.period.year}`;
      } else {
        periodLabel = `${item.period.year}`;
      }
      
      return {
        ...item,
        periodLabel,
      };
    });

    // Sort by period
    result.sort((a, b) => {
      if (a.period.year !== b.period.year) {
        return a.period.year - b.period.year;
      }
      if (a.period.month !== b.period.month) {
        return a.period.month - b.period.month;
      }
      if (a.period.day && b.period.day) {
        return a.period.day - b.period.day;
      }
      return 0;
    });

    res.status(200).json({ 
      success: true, 
      data: result,
      metadata: {
        totalRecords,
        completedRecords,
        hasData: result.length > 0
      }
    });
  } catch (error) {
    console.error("Error fetching cash flow analysis:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching cash flow analysis",
      error: error.message,
    });
  }
};

/**
 * Get Cash Flow by Category
 */
export const getCashFlowByCategory = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // Convert companyId to ObjectId if needed
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      companyId = new mongoose.Types.ObjectId(companyId);
    }

    const { startDate, endDate, transactionType } = req.query;

    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const matchFilter = {
      companyId,
      transactionStatus: "Completed",
      ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter }),
      ...(transactionType && { transactionType }),
    };

    const categoryData = await Finance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            category: "$category",
            type: "$transactionType",
          },
          total: { $sum: "$transactionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Process data - sum by category (not replace)
    const processedData = {};
    categoryData.forEach((item) => {
      const category = item._id.category;
      if (!processedData[category]) {
        processedData[category] = {
          category,
          income: 0,
          expense: 0,
          transfer: 0,
          count: 0,
        };
      }
      if (item._id.type === "Income") {
        processedData[category].income += item.total;
      } else if (item._id.type === "Expense") {
        processedData[category].expense += item.total;
      } else if (item._id.type === "Transfer") {
        processedData[category].transfer += item.total;
      }
      processedData[category].count += item.count;
      processedData[category].netCashFlow =
        processedData[category].income - processedData[category].expense;
    });

    const result = Object.values(processedData).sort(
      (a, b) => Math.abs(b.netCashFlow) - Math.abs(a.netCashFlow)
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching cash flow by category:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching cash flow by category",
      error: error.message,
    });
  }
};

/**
 * Get Cash Flow by Bank Account
 */
export const getCashFlowByBankAccount = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // Convert companyId to ObjectId if needed
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      companyId = new mongoose.Types.ObjectId(companyId);
    }

    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const matchFilter = {
      companyId,
      transactionStatus: "Completed",
      ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter }),
    };

    const bankAccountData = await Finance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            bankAccount: "$bankAccount",
            type: "$transactionType",
          },
          total: { $sum: "$transactionAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Process data - sum by bank account (not replace)
    const processedData = {};
    bankAccountData.forEach((item) => {
      const bankAccount = item._id.bankAccount;
      if (!processedData[bankAccount]) {
        processedData[bankAccount] = {
          bankAccount,
          income: 0,
          expense: 0,
          transfer: 0,
          count: 0,
        };
      }
      if (item._id.type === "Income") {
        processedData[bankAccount].income += item.total;
      } else if (item._id.type === "Expense") {
        processedData[bankAccount].expense += item.total;
      } else if (item._id.type === "Transfer") {
        processedData[bankAccount].transfer += item.total;
      }
      processedData[bankAccount].count += item.count;
      processedData[bankAccount].netCashFlow =
        processedData[bankAccount].income - processedData[bankAccount].expense;
    });

    const result = Object.values(processedData).sort(
      (a, b) => b.netCashFlow - a.netCashFlow
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching cash flow by bank account:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching cash flow by bank account",
      error: error.message,
    });
  }
};

/**
 * Get Cumulative Cash Flow
 */
export const getCumulativeCashFlow = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // Convert companyId to ObjectId if needed
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      companyId = new mongoose.Types.ObjectId(companyId);
    }

    const { startDate, endDate, period = "monthly" } = req.query;

    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const matchFilter = {
      companyId,
      transactionStatus: "Completed",
      ...(Object.keys(dateFilter).length > 0 && { transactionDate: dateFilter }),
    };

    // Group by period
    let groupFormat = {};
    switch (period) {
      case "daily":
        groupFormat = {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
          day: { $dayOfMonth: "$transactionDate" },
        };
        break;
      case "weekly":
        groupFormat = {
          year: { $year: "$transactionDate" },
          week: { $week: "$transactionDate" },
        };
        break;
      case "monthly":
      default:
        groupFormat = {
          year: { $year: "$transactionDate" },
          month: { $month: "$transactionDate" },
        };
        break;
    }

    const cashFlowData = await Finance.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            ...groupFormat,
            type: "$transactionType",
          },
          total: { $sum: "$transactionAmount" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.quarter": 1,
          "_id.week": 1,
          "_id.day": 1,
        },
      },
    ]);

    // Process and calculate cumulative - group by period (without type)
    const periodMap = {};
    cashFlowData.forEach((item) => {
      // Create key without type
      const periodKey = JSON.stringify({
        year: item._id.year,
        month: item._id.month || null,
        day: item._id.day || null,
        week: item._id.week || null,
        quarter: item._id.quarter || null,
      });
      
      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          period: {
            year: item._id.year,
            month: item._id.month || null,
            day: item._id.day || null,
            week: item._id.week || null,
            quarter: item._id.quarter || null,
          },
          income: 0,
          expense: 0,
          transfer: 0,
        };
      }
      
      if (item._id.type === "Income") {
        periodMap[periodKey].income += item.total;
      } else if (item._id.type === "Expense") {
        periodMap[periodKey].expense += item.total;
      } else if (item._id.type === "Transfer") {
        periodMap[periodKey].transfer += item.total;
      }
      
      periodMap[periodKey].netCashFlow =
        periodMap[periodKey].income - periodMap[periodKey].expense;
    });

    const sortedPeriods = Object.values(periodMap).sort((a, b) => {
      if (a.period.year !== b.period.year) {
        return a.period.year - b.period.year;
      }
      if (a.period.month !== b.period.month) {
        return (a.period.month || 0) - (b.period.month || 0);
      }
      if (a.period.week !== b.period.week) {
        return (a.period.week || 0) - (b.period.week || 0);
      }
      if (a.period.quarter !== b.period.quarter) {
        return (a.period.quarter || 0) - (b.period.quarter || 0);
      }
      return (a.period.day || 0) - (b.period.day || 0);
    });

    // Calculate cumulative
    let cumulative = 0;
    const result = sortedPeriods.map((item) => {
      cumulative += item.netCashFlow;
      
      let periodLabel = "";
      if (period === "daily" && item.period.day && item.period.month) {
        periodLabel = `${item.period.day}/${item.period.month}/${item.period.year}`;
      } else if (period === "weekly" && item.period.week) {
        periodLabel = `Week ${item.period.week}/${item.period.year}`;
      } else if (period === "quarterly" && item.period.quarter) {
        periodLabel = `Q${item.period.quarter}/${item.period.year}`;
      } else if (item.period.month) {
        periodLabel = `${item.period.month}/${item.period.year}`;
      } else {
        periodLabel = `${item.period.year}`;
      }
      
      return {
        ...item,
        cumulative,
        periodLabel,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching cumulative cash flow:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching cumulative cash flow",
      error: error.message,
    });
  }
};

/**
 * Get Cash Flow Forecast
 */
export const getCashFlowForecast = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // Convert companyId to ObjectId if needed
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      companyId = new mongoose.Types.ObjectId(companyId);
    }

    const { months = 3 } = req.query; // Forecast for next N months

    // Get historical data (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const historicalData = await Finance.aggregate([
      {
        $match: {
          companyId,
          transactionStatus: "Completed",
          transactionDate: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$transactionDate" },
            month: { $month: "$transactionDate" },
            type: "$transactionType",
          },
          total: { $sum: "$transactionAmount" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    // Calculate averages - group by period (without type)
    const monthlyData = {};
    historicalData.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expense: 0, transfer: 0 };
      }
      if (item._id.type === "Income") {
        monthlyData[key].income += item.total;
      } else if (item._id.type === "Expense") {
        monthlyData[key].expense += item.total;
      } else if (item._id.type === "Transfer") {
        monthlyData[key].transfer += item.total;
      }
    });

    const values = Object.values(monthlyData);
    const avgIncome =
      values.reduce((sum, v) => sum + v.income, 0) / values.length || 0;
    const avgExpense =
      values.reduce((sum, v) => sum + v.expense, 0) / values.length || 0;

    // Generate forecast
    const forecast = [];
    const today = new Date();
    for (let i = 1; i <= parseInt(months); i++) {
      const forecastDate = new Date(today);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      // Simple forecast: use average with slight variation
      const incomeVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const expenseVariation = (Math.random() - 0.5) * 0.2;

      forecast.push({
        period: {
          year: forecastDate.getFullYear(),
          month: forecastDate.getMonth() + 1,
        },
        periodLabel: `${forecastDate.getMonth() + 1}/${forecastDate.getFullYear()}`,
        forecastedIncome: avgIncome * (1 + incomeVariation),
        forecastedExpense: avgExpense * (1 + expenseVariation),
        forecastedNetCashFlow:
          avgIncome * (1 + incomeVariation) - avgExpense * (1 + expenseVariation),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        forecast,
        averages: {
          income: avgIncome,
          expense: avgExpense,
          netCashFlow: avgIncome - avgExpense,
        },
      },
    });
  } catch (error) {
    console.error("Error generating cash flow forecast:", error.message);
    res.status(500).json({
      success: false,
      message: "Error generating cash flow forecast",
      error: error.message,
    });
  }
};

