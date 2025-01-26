import Finance from "../models/finance.model.js";
import jwt from "jsonwebtoken";

// Create a new finance record
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
    supplierId,
    supplierName,
    attachmentURL,
    invoiceNumber,
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

  try {
    // יצירת רשומת פיננסים חדשה
    const newFinanceRecord = new Finance({
      companyId, // מועבר מהטוקן
      transactionDate,
      transactionType,
      transactionAmount,
      transactionCurrency,
      transactionDescription,
      category,
      bankAccount,
      transactionStatus,
      supplierId,
      supplierName,
      attachmentURL,
      invoiceNumber,
    });

    const savedFinanceRecord = await newFinanceRecord.save();
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
    const financeRecords = await Finance.find({ companyId }).populate(
      "companyId",
      "CompanyName"
    );

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
      .populate("supplierId", "SupplierName");
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
    const updatedFinanceRecord = await Finance.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("companyId", "CompanyName")
      .populate("supplierId", "SupplierName");

    if (!updatedFinanceRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Finance record not found" });
    }

    res.status(200).json({ success: true, data: updatedFinanceRecord });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating finance record",
      error: error.message,
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
