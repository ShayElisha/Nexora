import Invoice from "../models/invoice.model.js";
import Procurement from "../models/procurement.model.js";
import Company from "../models/companies.model.js";
import Customer from "../models/customers.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Employee from "../models/employees.model.js";
import ExchangeRate from "../models/ExchangeRate.model.js";
import Finance from "../models/finance.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { transporter } from "../config/lib/nodemailer.js";
import { createPaymentInvoiceEmail } from "../emails/emailHandlers.js";
import puppeteer from "puppeteer";
import { uploadToCloudinary } from "../config/lib/cloudinary.js";

/**
 * Generate unique invoice number based on company settings
 */
const generateInvoiceNumber = async (companyId) => {
  try {
    // Get company settings
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    // Get invoice settings from company (or use defaults)
    const prefix = company.invoiceSettings?.invoiceNumberPrefix || "INV";
    const format = company.invoiceSettings?.invoiceNumberFormat || "YYYY-####";
    const year = new Date().getFullYear();
    const yearShort = year.toString().slice(-2);

    // Build pattern based on format
    let pattern;
    let searchPattern;

    switch (format) {
      case "YY-####":
        pattern = `${prefix}-${yearShort}-`;
        searchPattern = new RegExp(`^${prefix}-${yearShort}-`);
        break;
      case "####-YYYY":
        pattern = `${prefix}-`;
        searchPattern = new RegExp(`^${prefix}-\\d{4}-${year}`);
        break;
      case "PREFIX-YYYY-####":
        pattern = `${prefix}-${year}-`;
        searchPattern = new RegExp(`^${prefix}-${year}-`);
        break;
      case "YYYY-####":
      default:
        pattern = `${prefix}-${year}-`;
        searchPattern = new RegExp(`^${prefix}-${year}-`);
        break;
    }

    // Find the last invoice for this company with matching pattern
    const lastInvoice = await Invoice.findOne({
      companyId,
      invoiceNumber: searchPattern,
    })
      .sort({ invoiceNumber: -1 })
      .select("invoiceNumber");

    let sequence = 1;
    if (lastInvoice) {
      // Extract sequence number from last invoice
      const lastSequence = parseInt(
        lastInvoice.invoiceNumber.replace(new RegExp(`^${prefix}-?`), "").replace(/^.*-/, "")
      );
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    // Format sequence number with padding
    const sequenceStr = sequence.toString().padStart(4, "0");

    // Build final invoice number based on format
    let invoiceNumber;
    switch (format) {
      case "####-YYYY":
        invoiceNumber = `${prefix}-${sequenceStr}-${year}`;
        break;
      case "YY-####":
        invoiceNumber = `${prefix}-${yearShort}-${sequenceStr}`;
        break;
      case "PREFIX-YYYY-####":
        invoiceNumber = `${prefix}-${year}-${sequenceStr}`;
        break;
      case "YYYY-####":
      default:
        invoiceNumber = `${prefix}-${year}-${sequenceStr}`;
        break;
    }

    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback to default format
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const lastInvoice = await Invoice.findOne({
      companyId,
      invoiceNumber: new RegExp(`^${prefix}`),
    })
      .sort({ invoiceNumber: -1 })
      .select("invoiceNumber");

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(
        lastInvoice.invoiceNumber.replace(prefix, "")
      );
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, "0")}`;
  }
};

/**
 * Validate invoice data
 */
const validateInvoice = async (invoiceData, companyId) => {
  const errors = [];

  // Validate companyId exists
  if (companyId) {
    const company = await Company.findById(companyId);
    if (!company) {
      errors.push("Company not found");
    }
  }

  // Validate customerId exists if provided
  if (invoiceData.customerId) {
    const customer = await Customer.findById(invoiceData.customerId);
    if (!customer) {
      errors.push("Customer not found");
    }
  }

  // Validate orderId exists if provided
  if (invoiceData.orderId) {
    const order = await CustomerOrder.findById(invoiceData.orderId);
    if (!order) {
      errors.push("Order not found");
    }
  }

  // Validate items array is not empty
  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.push("Invoice must have at least one item");
  }

  // Validate dueDate is after issueDate
  if (invoiceData.issueDate && invoiceData.dueDate) {
    if (new Date(invoiceData.dueDate) < new Date(invoiceData.issueDate)) {
      errors.push("Due date must be after issue date");
    }
  }

  // Validate currency is valid (3 uppercase letters)
  if (invoiceData.currency && !/^[A-Z]{3}$/.test(invoiceData.currency)) {
    errors.push("Invalid currency code. Must be 3 uppercase letters (e.g., USD, EUR, ILS)");
  }

  // Validate items have valid data
  if (invoiceData.items && invoiceData.items.length > 0) {
    invoiceData.items.forEach((item, index) => {
      if (!item.description || item.description.trim() === "") {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Unit price must be greater than or equal to 0`);
      }
    });
  }

  return errors;
};

/**
 * Get exchange rate for currency conversion
 */
const getExchangeRate = async (fromCurrency, toCurrency, companyId = null, date = null) => {
  try {
    const searchDate = date || new Date();
    
    // Try to find company-specific rate first
    if (companyId) {
      const companyRate = await ExchangeRate.findOne({
        companyId,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        date: { $lte: searchDate },
        isActive: true,
      }).sort({ date: -1 });

      if (companyRate) {
        return companyRate.rate;
      }
    }

    // Try to find global rate
    const globalRate = await ExchangeRate.findOne({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      date: { $lte: searchDate },
      isActive: true,
      companyId: { $exists: false },
    }).sort({ date: -1 });

    if (globalRate) {
      return globalRate.rate;
    }

    // If same currency, return 1
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return 1;
    }

    // Default to 1 if no rate found (should ideally fetch from API)
    console.warn(`⚠️ No exchange rate found for ${fromCurrency} to ${toCurrency}, using 1.0`);
    return 1;
  } catch (error) {
    console.error("Error getting exchange rate:", error);
    return 1; // Default fallback
  }
};

/**
 * Add history entry to invoice
 */
const addInvoiceHistory = (invoice, changedBy, action, changes = {}, reason = null) => {
  if (!invoice.history) {
    invoice.history = [];
  }

  const historyEntry = {
    changedBy,
    changedAt: new Date(),
    changes: new Map(Object.entries(changes)),
    action,
    reason,
  };

  invoice.history.push(historyEntry);
  
  // Keep only last 50 history entries to prevent unbounded growth
  if (invoice.history.length > 50) {
    invoice.history = invoice.history.slice(-50);
  }
};

/**
 * Create invoice for SuperAdmin (with companyId in body)
 */
export const createInvoiceForSuperAdmin = async (req, res) => {
  try {
    const {
      companyId,
      customerId,
      orderId,
      issueDate,
      dueDate,
      items,
      globalDiscount,
      taxRate,
      notes,
      paymentTerms,
      billingAddress,
      shippingAddress,
      currency,
    } = req.body;

    // Validate required fields
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    // Validate invoice data
    const validationErrors = await validateInvoice({
      companyId,
      customerId,
      orderId,
      issueDate,
      dueDate,
      items,
      currency,
    }, companyId);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: validationErrors,
      });
    }

    // Get company for default currency and exchange rate
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const invoiceCurrency = currency || company.invoiceSettings?.defaultCurrency || "USD";
    const baseCurrency = company.invoiceSettings?.baseCurrency || "USD";

    // Get exchange rate if currency is different from base currency
    let exchangeRate = 1;
    let baseCurrencyAmount = null;
    if (invoiceCurrency !== baseCurrency) {
      exchangeRate = await getExchangeRate(invoiceCurrency, baseCurrency, companyId, new Date(issueDate || Date.now()));
      console.log(`💰 Exchange rate ${invoiceCurrency} to ${baseCurrency}: ${exchangeRate}`);
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(companyId);

    // Create invoice
    const invoice = new Invoice({
      companyId,
      invoiceNumber,
      customerId: customerId || null,
      orderId: orderId || null,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items,
      globalDiscount: globalDiscount || { type: "percentage", value: 0 },
      taxRate: taxRate || 0,
      notes: notes || "",
      paymentTerms: paymentTerms || "Net 30",
      billingAddress: billingAddress || {},
      shippingAddress: shippingAddress || {},
      createdBy: null, // SuperAdmin doesn't have employeeId
      status: "Draft",
      currency: invoiceCurrency,
      baseCurrency: baseCurrency,
      exchangeRate: exchangeRate,
      baseCurrencyAmount: baseCurrencyAmount,
    });

    // Add history entry for creation
    addInvoiceHistory(invoice, null, "created", {
      invoiceNumber,
      status: "Draft",
      totalAmount: invoice.totalAmount,
    }, "Invoice created by SuperAdmin");

    await invoice.save();
    
    // Calculate base currency amount after invoice is saved (so we have totalAmount)
    if (invoice.totalAmount && exchangeRate !== 1) {
      baseCurrencyAmount = invoice.totalAmount * exchangeRate;
      invoice.baseCurrencyAmount = baseCurrencyAmount;
      await invoice.save();
    }

    // Populate related data
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customerId", "name email phone address")
      .populate("orderId")
      .populate("companyId", "name email phone address logo");

    // Send invoice email automatically - SuperAdmin sends to company only
    try {
      await sendInvoiceEmail(populatedInvoice, true); // sendToCompany = true for SuperAdmin
    } catch (emailError) {
      console.error("❌ Error sending invoice email (invoice still created):", emailError.message);
      // Don't fail invoice creation if email fails
    }

    return res.status(201).json({
      success: true,
      data: populatedInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice for SuperAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating invoice",
      error: error.message,
    });
  }
};

/**
 * Create a new invoice
 */
export const createInvoice = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    
    // Try to get employeeId from different possible fields in token
    let employeeId = decodedToken.employeeId || decodedToken.userId || decodedToken.id;
    
    // If still no employeeId, try to get it from the Employee model using userId
    if (!employeeId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee) {
          employeeId = employee._id;
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
      }
    }
    
    // If companyId is not in token, try to get it from user's company
    let finalCompanyId = companyId;
    if (!finalCompanyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee && employee.company) {
          finalCompanyId = employee.company;
        } else if (employee && employee.companyId) {
          finalCompanyId = employee.companyId;
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }

    const {
      customerId,
      orderId,
      procurementId, // קישור לרכישה (לחשבוניות ספק)
      issueDate,
      dueDate,
      items,
      globalDiscount,
      taxRate,
      notes,
      paymentTerms,
      billingAddress,
      shippingAddress,
      currency,
    } = req.body;

    // Validate invoice data
    const validationErrors = await validateInvoice({
      companyId: finalCompanyId,
      customerId,
      orderId,
      issueDate,
      dueDate,
      items,
      currency,
    }, finalCompanyId);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: validationErrors,
      });
    }

    // Get company for default currency and exchange rate
    const company = await Company.findById(finalCompanyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const invoiceCurrency = currency || company.invoiceSettings?.defaultCurrency || "USD";
    const baseCurrency = company.invoiceSettings?.baseCurrency || "USD";

    // Get exchange rate if currency is different from base currency
    let exchangeRate = 1;
    let baseCurrencyAmount = null;
    if (invoiceCurrency !== baseCurrency) {
      exchangeRate = await getExchangeRate(invoiceCurrency, baseCurrency, finalCompanyId, new Date(issueDate || Date.now()));
      console.log(`💰 Exchange rate ${invoiceCurrency} to ${baseCurrency}: ${exchangeRate}`);
    }

    console.log("Creating invoice with data:", {
      companyId: finalCompanyId,
      itemsCount: items?.length,
      hasItems: !!items,
      currency: invoiceCurrency,
      baseCurrency: baseCurrency,
      exchangeRate: exchangeRate,
    });

    // Convert companyId to ObjectId if needed
    let finalCompanyIdObj = finalCompanyId;
    if (typeof finalCompanyId === "string" && mongoose.Types.ObjectId.isValid(finalCompanyId)) {
      finalCompanyIdObj = new mongoose.Types.ObjectId(finalCompanyId);
    }

    // Convert customerId to ObjectId if provided
    let finalCustomerId = null;
    if (customerId) {
      if (mongoose.Types.ObjectId.isValid(customerId)) {
        finalCustomerId = new mongoose.Types.ObjectId(customerId);
      } else {
        finalCustomerId = customerId;
      }
    }

    // Convert orderId to ObjectId if provided
    let finalOrderId = null;
    if (orderId) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        finalOrderId = new mongoose.Types.ObjectId(orderId);
      } else {
        finalOrderId = orderId;
      }
    }

    // Process items - calculate total for each item (if items exist)
    const processedItems = items && items.length > 0 ? items.map((item) => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      const itemDiscount = item.discount ? (itemTotal * item.discount) / 100 : 0;
      return {
        description: item.description || "",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
        total: itemTotal - itemDiscount,
      };
    }) : [];

    // Generate invoice number (only if companyId exists)
    let invoiceNumber = null;
    if (finalCompanyIdObj) {
      try {
        invoiceNumber = await generateInvoiceNumber(finalCompanyIdObj);
      } catch (err) {
        console.error("Error generating invoice number:", err);
        // Generate a simple invoice number if generation fails
        invoiceNumber = `INV-${Date.now()}`;
      }
    } else {
      invoiceNumber = `INV-${Date.now()}`;
    }

    console.log("Generated invoice number:", invoiceNumber);

    // Create invoice with all defaults
    const invoiceData = {
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: processedItems || [],
      globalDiscount: globalDiscount || { type: "percentage", value: 0 },
      taxRate: taxRate || 0,
      notes: notes || "",
      paymentTerms: paymentTerms || "Net 30",
      billingAddress: billingAddress || {},
      shippingAddress: shippingAddress || {},
      status: "Draft",
      currency: invoiceCurrency,
      baseCurrency: baseCurrency,
      exchangeRate: exchangeRate,
      baseCurrencyAmount: baseCurrencyAmount,
      paymentStatus: "Unpaid",
      paidAmount: 0,
    };

    // Add optional fields only if they exist
    if (finalCompanyIdObj) {
      invoiceData.companyId = finalCompanyIdObj;
    }
    if (finalCustomerId) {
      invoiceData.customerId = finalCustomerId;
    }
    if (finalOrderId) {
      invoiceData.orderId = finalOrderId;
    }
    // Add procurementId if provided
    if (procurementId && mongoose.Types.ObjectId.isValid(procurementId)) {
      invoiceData.procurementId = new mongoose.Types.ObjectId(procurementId);
    }
    if (employeeId) {
      invoiceData.createdBy = employeeId;
    }

    const invoice = new Invoice(invoiceData);

    // Add history entry for creation
    addInvoiceHistory(invoice, employeeId, "created", {
      invoiceNumber: invoice.invoiceNumber,
      status: "Draft",
      totalAmount: invoice.totalAmount,
      currency: invoiceCurrency,
    }, "Invoice created");

    console.log("Saving invoice...");
    await invoice.save();
    console.log("Invoice saved successfully:", invoice._id);
    
    // Calculate base currency amount after invoice is saved (so we have totalAmount)
    if (invoice.totalAmount && exchangeRate !== 1) {
      baseCurrencyAmount = invoice.totalAmount * exchangeRate;
      invoice.baseCurrencyAmount = baseCurrencyAmount;
      await invoice.save();
    }

    // Populate related data
    console.log("Populating invoice data...");
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate({
        path: "customerId",
        select: "name email phone address",
        options: { strictPopulate: false }
      })
      .populate({
        path: "orderId",
        options: { strictPopulate: false }
      })
      .populate({
        path: "createdBy",
        select: "name email",
        options: { strictPopulate: false }
      })
      .populate({
        path: "companyId",
        select: "name email phone address logo",
        options: { strictPopulate: false }
      });

    console.log("Invoice created successfully");

    // עדכון Procurement אם קיים קישור (לחשבוניות ספק)
    if (procurementId && mongoose.Types.ObjectId.isValid(procurementId)) {
      try {
        const procurement = await Procurement.findById(procurementId);
        if (procurement) {
          // אימות סכום (אם החשבונית היא לספק)
          if (invoice.totalAmount > procurement.totalCost) {
            console.warn(`⚠️ Invoice amount (${invoice.totalAmount}) exceeds procurement total cost (${procurement.totalCost})`);
            // לא נכשל את הבקשה, רק נדפיס אזהרה
          }

          // הוספת Invoice ל-Procurement
          if (!procurement.invoices) {
            procurement.invoices = [];
          }
          procurement.invoices.push({
            invoiceId: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount,
            currency: invoice.currency || procurement.currency || "USD",
            invoiceDate: invoice.issueDate,
            addedAt: new Date(),
          });

          // עדכון סטטוס תשלום
          const totalPaid = procurement.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
          if (totalPaid >= procurement.totalCost) {
            procurement.paymentStatus = "Paid";
          } else if (totalPaid > 0) {
            procurement.paymentStatus = "Partial";
          } else {
            procurement.paymentStatus = "Unpaid";
          }

          await procurement.save();
          console.log(`✅ Procurement ${procurementId} updated with invoice ${invoice._id}`);
        }
      } catch (procurementError) {
        console.error("Error updating procurement:", procurementError.message);
        // לא נכשל את כל הבקשה אם יש בעיה בעדכון הרכישה
      }
    }

    // Send invoice email automatically - Nexora sends to customer only
    try {
      await sendInvoiceEmail(populatedInvoice, false); // sendToCompany = false for Nexora (send to customer)
    } catch (emailError) {
      console.error("❌ Error sending invoice email (invoice still created):", emailError.message);
      // Don't fail invoice creation if email fails
    }

    return res.status(201).json({
      success: true,
      data: populatedInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Check for validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }
    
    // Check for duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error creating invoice",
      error: error.message,
      errorName: error.name,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Get all invoices (for SuperAdmin - all companies)
 */
export const getAllInvoicesForSuperAdmin = async (req, res) => {
  try {
    // This endpoint is for SuperAdmin only
    // It should be protected by SuperAdmin authentication
    // Only return invoices without customerId (company subscription invoices)
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      // Only company invoices (subscriptions) - no customer invoices
      $or: [
        { customerId: null },
        { customerId: { $exists: false } }
      ]
    };

    if (status && status !== "all") {
      query.status = status;
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) {
        query.issueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.issueDate.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoice.find(query)
      .populate("companyId", "name email phone address logo")
      .populate("createdBy", "name")
      .sort({ issueDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Invoice.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices",
      error: error.message,
    });
  }
};

/**
 * Get all invoices for a company
 */
export const getInvoices = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee) {
          if (employee.company) {
            companyId = employee.company;
          } else if (employee.companyId) {
            companyId = employee.companyId;
          }
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }
    
    if (!companyId) {
      console.error("No companyId found in token or employee record");
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const {
      status,
      customerId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Convert companyId to ObjectId if it's a string
    let finalCompanyId = companyId;
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      try {
        finalCompanyId = new mongoose.Types.ObjectId(companyId);
      } catch (err) {
        console.error("Error converting companyId to ObjectId:", err);
        finalCompanyId = companyId;
      }
    }

    const query = { companyId: finalCompanyId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (customerId) {
      if (mongoose.Types.ObjectId.isValid(customerId)) {
        query.customerId = new mongoose.Types.ObjectId(customerId);
      } else {
        query.customerId = customerId;
      }
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) {
        query.issueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.issueDate.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log("Fetching invoices with query:", JSON.stringify(query, null, 2));

    const invoices = await Invoice.find(query)
      .populate({
        path: "customerId",
        select: "name email",
        options: { strictPopulate: false }
      })
      .populate({
        path: "createdBy",
        select: "name email",
        options: { strictPopulate: false }
      })
      .populate({
        path: "companyId",
        select: "name email",
        options: { strictPopulate: false }
      })
      .sort({ issueDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Invoice.countDocuments(query);

    console.log(`Found ${invoices.length} invoices out of ${total} total`);

    return res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoices",
      error: error.message,
      errorName: error.name,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Get single invoice by ID
 */
export const getInvoiceById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee && employee.company) {
          companyId = employee.company;
        } else if (employee && employee.companyId) {
          companyId = employee.companyId;
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }

    const query = { _id: req.params.id };
    if (companyId) {
      query.companyId = companyId;
    }

    const invoice = await Invoice.findOne(query)
      .populate("customerId", "name email phone address")
      .populate("orderId")
      .populate("createdBy", "name email")
      .populate("companyId", "name email phone address logo")
      .populate("paymentId");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoice",
      error: error.message,
    });
  }
};

/**
 * Get single invoice by ID for SuperAdmin (no company restriction)
 */
export const getInvoiceByIdForSuperAdmin = async (req, res) => {
  try {
    // For SuperAdmin, we allow access to any invoice without company restriction
    const invoiceId = req.params.id;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(invoiceId)
      .populate("customerId", "name email phone address")
      .populate("orderId")
      .populate("createdBy", "name email")
      .populate("companyId", "name email phone address logo")
      .populate("paymentId");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice for SuperAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoice",
      error: error.message,
    });
  }
};

/**
 * Update invoice
 */
export const updateInvoice = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee && employee.company) {
          companyId = employee.company;
        } else if (employee && employee.companyId) {
          companyId = employee.companyId;
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }

    const query = { _id: req.params.id };
    if (companyId) {
      query.companyId = companyId;
    }

    const invoice = await Invoice.findOne(query);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Don't allow updating paid or cancelled invoices
    if (invoice.status === "Paid" || invoice.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${invoice.status} invoice`,
      });
    }

    // Update fields
    const {
      customerId,
      issueDate,
      dueDate,
      items,
      globalDiscount,
      taxRate,
      notes,
      paymentTerms,
      billingAddress,
      shippingAddress,
      status,
    } = req.body;

    if (items) invoice.items = items;
    if (customerId !== undefined) invoice.customerId = customerId;
    if (issueDate) invoice.issueDate = new Date(issueDate);
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (globalDiscount) invoice.globalDiscount = globalDiscount;
    if (taxRate !== undefined) invoice.taxRate = taxRate;
    if (notes !== undefined) invoice.notes = notes;
    if (paymentTerms) invoice.paymentTerms = paymentTerms;
    if (billingAddress) invoice.billingAddress = billingAddress;
    if (shippingAddress) invoice.shippingAddress = shippingAddress;
    // Track changes for history
    const changes = {};
    const oldStatus = invoice.status;
    
    if (status && ["Draft", "Sent", "Paid", "Overdue", "Cancelled"].includes(status)) {
      if (invoice.status !== status) {
        changes.status = { from: invoice.status, to: status };
        invoice.status = status;
        if (status === "Sent" && !invoice.sentDate) {
          invoice.sentDate = new Date();
        }
      }
    }

    // Track other changes
    if (items && JSON.stringify(items) !== JSON.stringify(invoice.items)) {
      changes.items = "modified";
    }
    if (dueDate && new Date(dueDate).getTime() !== new Date(invoice.dueDate).getTime()) {
      changes.dueDate = { from: invoice.dueDate, to: dueDate };
    }

    // Get employeeId for history
    let employeeId = decodedToken.employeeId || decodedToken.userId || decodedToken.id;
    if (!employeeId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee) {
          employeeId = employee._id;
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
      }
    }

    // Add history entry if there are changes
    if (Object.keys(changes).length > 0) {
      let action = "updated";
      if (changes.status) {
        action = oldStatus === "Draft" && invoice.status === "Sent" ? "sent" : "status_changed";
      }
      addInvoiceHistory(invoice, employeeId, action, changes);
    }

    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customerId", "name email phone address")
      .populate("orderId")
      .populate("createdBy", "name email")
      .populate("companyId", "name email phone address logo");

    return res.status(200).json({
      success: true,
      data: populatedInvoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating invoice",
      error: error.message,
    });
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee && employee.company) {
          companyId = employee.company;
        } else if (employee && employee.companyId) {
          companyId = employee.companyId;
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }

    const query = { _id: req.params.id };
    if (companyId) {
      query.companyId = companyId;
    }

    const invoice = await Invoice.findOne(query);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Only allow deleting draft invoices
    if (invoice.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Can only delete draft invoices",
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting invoice",
      error: error.message,
    });
  }
};

/**
 * Mark invoice as sent
 */
export const markAsSent = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee && employee.company) {
          companyId = employee.company;
        } else if (employee && employee.companyId) {
          companyId = employee.companyId;
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }

    const query = { _id: req.params.id };
    if (companyId) {
      query.companyId = companyId;
    }

    const invoice = await Invoice.findOne(query);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    invoice.status = "Sent";
    invoice.sentDate = new Date();
    await invoice.save();

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error marking invoice as sent:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating invoice status",
      error: error.message,
    });
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee && employee.company) {
          companyId = employee.company;
        } else if (employee && employee.companyId) {
          companyId = employee.companyId;
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }

    const { paidAmount, paymentId } = req.body;

    const query = { _id: req.params.id };
    if (companyId) {
      query.companyId = companyId;
    }

    const invoice = await Invoice.findOne(query);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Track changes
    const oldPaymentStatus = invoice.paymentStatus;
    const oldPaidAmount = invoice.paidAmount;
    
    invoice.paidAmount = paidAmount || 0;
    if (paymentId) invoice.paymentId = paymentId;

    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.paymentStatus = "Paid";
      invoice.status = "Paid";
      invoice.paymentDate = new Date();
    } else if (invoice.paidAmount > 0) {
      invoice.paymentStatus = "Partially Paid";
    } else {
      invoice.paymentStatus = "Unpaid";
    }

    // Get employeeId for history
    let employeeId = decodedToken.employeeId || decodedToken.userId || decodedToken.id;
    if (!employeeId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee) {
          employeeId = employee._id;
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
      }
    }

    // Add history entry if payment status changed
    if (oldPaymentStatus !== invoice.paymentStatus || oldPaidAmount !== invoice.paidAmount) {
      const action = invoice.paymentStatus === "Paid" ? "paid" : "updated";
      addInvoiceHistory(invoice, employeeId, action, {
        paymentStatus: { from: oldPaymentStatus, to: invoice.paymentStatus },
        paidAmount: { from: oldPaidAmount, to: invoice.paidAmount },
      }, "Payment status updated");
    }

    await invoice.save();

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error.message,
    });
  }
};

/**
 * Get invoice statistics for SuperAdmin (only company invoices - subscriptions)
 */
export const getInvoiceStatsForSuperAdmin = async (req, res) => {
  try {
    // Only count company invoices (subscriptions) - invoices without customerId
    const companyInvoicesFilter = {
      $or: [
        { customerId: null },
        { customerId: { $exists: false } }
      ]
    };

    const total = await Invoice.countDocuments(companyInvoicesFilter);
    const draft = await Invoice.countDocuments({ ...companyInvoicesFilter, status: "Draft" });
    const sent = await Invoice.countDocuments({ ...companyInvoicesFilter, status: "Sent" });
    const paid = await Invoice.countDocuments({ ...companyInvoicesFilter, status: "Paid" });
    const overdue = await Invoice.countDocuments({ ...companyInvoicesFilter, status: "Overdue" });

    const totalAmount = await Invoice.aggregate([
      { $match: companyInvoicesFilter },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const paidAmount = await Invoice.aggregate([
      {
        $match: {
          ...companyInvoicesFilter,
          paymentStatus: "Paid",
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const unpaidAmount = await Invoice.aggregate([
      {
        $match: {
          ...companyInvoicesFilter,
          paymentStatus: { $in: ["Unpaid", "Partially Paid"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        draft,
        sent,
        paid,
        overdue,
        totalAmount: totalAmount[0]?.total || 0,
        paidAmount: paidAmount[0]?.total || 0,
        unpaidAmount: unpaidAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching invoice stats for SuperAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoice statistics",
      error: error.message,
    });
  }
};

/**
 * Get invoice statistics
 */
export const getInvoiceStats = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee && employee.company) {
          companyId = employee.company;
        } else if (employee && employee.companyId) {
          companyId = employee.companyId;
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const total = await Invoice.countDocuments({ companyId });
    const draft = await Invoice.countDocuments({
      companyId,
      status: "Draft",
    });
    const sent = await Invoice.countDocuments({
      companyId,
      status: "Sent",
    });
    const paid = await Invoice.countDocuments({
      companyId,
      status: "Paid",
    });
    const overdue = await Invoice.countDocuments({
      companyId,
      status: "Overdue",
    });

    const totalAmount = await Invoice.aggregate([
      { $match: { companyId: companyId } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const paidAmount = await Invoice.aggregate([
      {
        $match: {
          companyId: companyId,
          paymentStatus: "Paid",
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const unpaidAmount = await Invoice.aggregate([
      {
        $match: {
          companyId: companyId,
          paymentStatus: { $in: ["Unpaid", "Partially Paid"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        draft,
        sent,
        paid,
        overdue,
        totalAmount: totalAmount[0]?.total || 0,
        paidAmount: paidAmount[0]?.total || 0,
        unpaidAmount: unpaidAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching invoice statistics",
      error: error.message,
    });
  }
};

/**
 * Generate invoice PDF (HTML version for printing)
 */
export const generateInvoicePDF = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee && employee.company) {
          companyId = employee.company;
        } else if (employee && employee.companyId) {
          companyId = employee.companyId;
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }

    const query = { _id: req.params.id };
    if (companyId) {
      query.companyId = companyId;
    }

    const invoice = await Invoice.findOne(query)
      .populate("customerId", "name email phone address")
      .populate("companyId", "name email phone address logo")
      .populate("createdBy", "name email");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice);

    return res.status(200).send(html);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating invoice PDF",
      error: error.message,
    });
  }
};

/**
 * Generate invoice PDF for SuperAdmin (HTML version for printing)
 * No company restriction - can access any invoice
 */
export const generateInvoicePDFForSuperAdmin = async (req, res) => {
  try {
    // For SuperAdmin, we allow access to any invoice without company restriction
    const invoiceId = req.params.id;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(invoiceId)
      .populate("customerId", "name email phone address")
      .populate("companyId", "name email phone address logo")
      .populate("createdBy", "name email");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice);

    return res.status(200).send(html);
  } catch (error) {
    console.error("Error generating invoice PDF for SuperAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating invoice PDF",
      error: error.message,
    });
  }
};

/**
 * Generate PDF buffer from invoice HTML and optionally upload to Cloudinary
 */
const generateInvoicePDFBuffer = async (invoice, uploadToCloud = true) => {
  try {
    console.log(`📄 Generating PDF buffer for invoice ${invoice.invoiceNumber}`);
    
    // Generate HTML for invoice
    const html = generateInvoiceHTML(invoice);
    
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content with HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    console.log(`✅ PDF buffer generated successfully (${pdfBuffer.length} bytes)`);
    
    // Upload to Cloudinary if requested
    if (uploadToCloud && pdfBuffer) {
      try {
        const uploadResult = await uploadToCloudinary(pdfBuffer, {
          folder: `invoices/${invoice.companyId || 'general'}`,
          public_id: `invoice_${invoice.invoiceNumber}_${invoice._id}`,
          resource_type: 'raw', // PDF is raw file type
          format: 'pdf',
        });
        
        // Update invoice with PDF URL
        if (invoice._id) {
          await Invoice.findByIdAndUpdate(invoice._id, {
            pdfUrl: uploadResult.secure_url,
            pdfStatus: 'generated',
            pdfGeneratedAt: new Date(),
          });
          
          console.log(`✅ PDF uploaded to Cloudinary: ${uploadResult.secure_url}`);
        }
        
        return { pdfBuffer, pdfUrl: uploadResult.secure_url };
      } catch (uploadError) {
        console.error("❌ Error uploading PDF to Cloudinary:", uploadError);
        // Still return buffer even if upload fails
        if (invoice._id) {
          await Invoice.findByIdAndUpdate(invoice._id, {
            pdfStatus: 'failed',
          });
        }
        return { pdfBuffer, pdfUrl: null };
      }
    }
    
    return { pdfBuffer, pdfUrl: null };
    
  } catch (error) {
    console.error("❌ Error generating PDF buffer:", error);
    console.error("❌ Error message:", error.message);
    
    // Update invoice status if ID exists
    if (invoice._id) {
      try {
        await Invoice.findByIdAndUpdate(invoice._id, {
          pdfStatus: 'failed',
        });
      } catch (updateError) {
        console.error("Error updating invoice PDF status:", updateError);
      }
    }
    
    throw error;
  }
};

/**
 * Send invoice email automatically
 * @param {Object} invoice - The invoice object
 * @param {Boolean} sendToCompany - If true, send to company only (SuperAdmin). If false, send to customer (Nexora)
 */
const sendInvoiceEmail = async (invoice, sendToCompany = false) => {
  try {
    // Populate invoice if not already populated
    let populatedInvoice = invoice;
    if (!invoice.companyId?.name) {
      populatedInvoice = await Invoice.findById(invoice._id)
        .populate("customerId", "name email phone address")
        .populate("companyId", "name email phone address logo");
    }

    const company = populatedInvoice.companyId;
    const customer = populatedInvoice.customerId;

    // Determine recipient email based on context
    let recipientEmail = null;
    let recipientName = null;

    if (sendToCompany) {
      // SuperAdmin: Send to company only
      if (company && company.email) {
        recipientEmail = company.email;
        recipientName = company.name;
        console.log(`📧 [SuperAdmin] Sending invoice to company: ${company.name} (${company.email})`);
      } else {
        console.warn(`⚠️ [SuperAdmin] Company has no email for invoice ${invoice.invoiceNumber}, skipping email send`);
        return;
      }
    } else {
      // Nexora: Send to customer only (if exists)
      if (customer && customer.email) {
        recipientEmail = customer.email;
        recipientName = customer.name;
        console.log(`📧 [Nexora] Sending invoice to customer: ${customer.name} (${customer.email})`);
      } else if (company && company.email) {
        // Fallback: if no customer, send to company
        recipientEmail = company.email;
        recipientName = company.name;
        console.log(`📧 [Nexora] No customer email, sending to company: ${company.name} (${company.email})`);
      } else {
        console.warn(`⚠️ [Nexora] No email found for invoice ${invoice.invoiceNumber}, skipping email send`);
        return;
      }
    }

    if (!recipientEmail) {
      console.warn(`⚠️ No email found for invoice ${invoice.invoiceNumber}, skipping email send`);
      return;
    }

    console.log(`📧 Sending invoice email to ${recipientEmail} for invoice ${invoice.invoiceNumber}`);

    // Generate PDF buffer and upload to Cloudinary
    let pdfBuffer = null;
    let pdfUrl = null;
    try {
      const pdfResult = await generateInvoicePDFBuffer(populatedInvoice, true); // Upload to Cloudinary
      pdfBuffer = pdfResult.pdfBuffer;
      pdfUrl = pdfResult.pdfUrl || populatedInvoice.pdfUrl; // Use uploaded URL or existing
      console.log(`✅ PDF buffer generated successfully`);
      
      // Update PDF URL if we got a new one
      if (pdfUrl && !populatedInvoice.pdfUrl) {
        populatedInvoice.pdfUrl = pdfUrl;
        await Invoice.findByIdAndUpdate(populatedInvoice._id, { pdfUrl });
      }
      
      // Save PDF URL to financial record
      if (pdfUrl && populatedInvoice._id) {
        try {
          const financialRecord = await Finance.findOne({ invoiceId: populatedInvoice._id });
          if (financialRecord) {
            financialRecord.attachmentURL = financialRecord.attachmentURL || [];
            if (!financialRecord.attachmentURL.includes(pdfUrl)) {
              financialRecord.attachmentURL.push(pdfUrl);
              await financialRecord.save();
              console.log(`✅ PDF URL saved to financial record ${financialRecord._id}`);
            }
          }
        } catch (financeError) {
          console.error("❌ Error saving PDF URL to financial record:", financeError.message);
        }
      }
    } catch (pdfError) {
      console.error("❌ Error generating PDF buffer, sending email without attachment:", pdfError.message);
      // Continue without PDF attachment if generation fails
      pdfUrl = populatedInvoice.pdfUrl; // Use existing URL if available
    }

    // Generate PDF URL (still include in email as backup - use Cloudinary URL if available)
    const baseUrl = process.env.NEXORA_API_URL || process.env.API_URL || "http://localhost:5000";
    const fallbackPdfUrl = `${baseUrl}/api/invoices/${invoice._id}/pdf`;
    const emailPdfUrl = pdfUrl || populatedInvoice.pdfUrl || fallbackPdfUrl;

    // Get logo URL
    const logoUrl = company?.logo 
      ? (company.logo.startsWith('http') ? company.logo : `${process.env.FRONTEND_URL || "http://localhost:5173"}${company.logo}`)
      : `${process.env.FRONTEND_URL || "http://localhost:5173"}/assets/logo.png`;

    // Create email HTML
    const emailHTML = createPaymentInvoiceEmail(recipientName || company?.name || "Customer", invoice, emailPdfUrl, logoUrl);

    // Prepare email data with PDF attachment if available
    const emailData = {
      from: process.env.EMAIL_USER || `Nexora <${process.env.EMAIL_FROM || 'noreply@nexora.com'}>`,
      to: recipientEmail,
      subject: `Nexora - Invoice ${invoice.invoiceNumber}`,
      html: emailHTML,
    };

    // Add PDF attachment if buffer is available
    if (pdfBuffer) {
      emailData.attachments = [
        {
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
      console.log(`📎 PDF attachment added to email`);
    }

    // Send email
    const info = await transporter.sendMail(emailData);
    console.log(`✅ Invoice email sent successfully to ${recipientEmail}`);
    console.log(`📧 Email message ID: ${info.messageId}`);
    
    // Add email history to invoice
    try {
      if (!populatedInvoice.emailHistory) {
        populatedInvoice.emailHistory = [];
      }
      populatedInvoice.emailHistory.push({
        sentAt: new Date(),
        recipient: recipientEmail,
        status: 'sent',
        messageId: info.messageId,
        type: 'invoice',
      });
      await Invoice.findByIdAndUpdate(populatedInvoice._id, {
        $push: { emailHistory: populatedInvoice.emailHistory[populatedInvoice.emailHistory.length - 1] }
      });
    } catch (historyError) {
      console.error("❌ Error saving email history:", historyError.message);
    }

  } catch (error) {
    console.error("❌ Error sending invoice email:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    // Don't throw - email failure shouldn't break invoice creation
  }
};

/**
 * Generate HTML template for invoice
 */
const generateInvoiceHTML = (invoice) => {
  const company = invoice.companyId;
  const customer = invoice.customerId;
  const logo = company.logo || "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border: 1px solid #ddd;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    .company-info {
      flex: 1;
    }
    .company-logo {
      max-width: 150px;
      max-height: 80px;
      margin-bottom: 10px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 18px;
      color: #666;
    }
    .details-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .bill-to, .invoice-details {
      flex: 1;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #333;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f5f5f5;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #ddd;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .totals-section {
      margin-left: auto;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .totals-row.total {
      font-weight: bold;
      font-size: 18px;
      border-top: 2px solid #333;
      padding-top: 12px;
      margin-top: 12px;
    }
    .notes-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 10px;
    }
    .status-paid {
      background: #d4edda;
      color: #155724;
    }
    .status-sent {
      background: #d1ecf1;
      color: #0c5460;
    }
    .status-overdue {
      background: #f8d7da;
      color: #721c24;
    }
    .status-draft {
      background: #e2e3e5;
      color: #383d41;
    }
    @media print {
      body {
        padding: 0;
      }
      .invoice-container {
        border: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        ${logo ? `<img src="${logo}" alt="Company Logo" class="company-logo" />` : ""}
        <h2>${company.name || "Company Name"}</h2>
        ${company.address ? `<p>${company.address.street || ""}</p>` : ""}
        ${company.address ? `<p>${company.address.city || ""}, ${company.address.state || ""} ${company.address.postalCode || ""}</p>` : ""}
        ${company.address ? `<p>${company.address.country || ""}</p>` : ""}
        ${company.email ? `<p>Email: ${company.email}</p>` : ""}
        ${company.phone ? `<p>Phone: ${company.phone}</p>` : ""}
      </div>
      <div class="invoice-info">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div style="margin-top: 20px;">
          <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> 
            <span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span>
          </p>
        </div>
      </div>
    </div>

    <div class="details-section">
      <div class="bill-to">
        <div class="section-title">Bill To:</div>
        ${customer ? `
          <p><strong>${customer.name || "Customer"}</strong></p>
          ${customer.email ? `<p>${customer.email}</p>` : ""}
          ${customer.phone ? `<p>${customer.phone}</p>` : ""}
          ${customer.address ? `<p>${customer.address}</p>` : ""}
        ` : "<p>No customer specified</p>"}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Discount</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item) => `
          <tr>
            <td>${item.description}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${invoice.currency} ${item.unitPrice.toFixed(2)}</td>
            <td class="text-right">${item.discount > 0 ? `${item.discount}%` : "-"}</td>
            <td class="text-right">${invoice.currency} ${item.total.toFixed(2)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${invoice.currency} ${invoice.subtotal.toFixed(2)}</span>
      </div>
      ${invoice.discountAmount > 0 ? `
      <div class="totals-row">
        <span>Discount:</span>
        <span>-${invoice.currency} ${invoice.discountAmount.toFixed(2)}</span>
      </div>
      ` : ""}
      ${invoice.taxAmount > 0 ? `
      <div class="totals-row">
        <span>Tax (${invoice.taxRate}%):</span>
        <span>${invoice.currency} ${invoice.taxAmount.toFixed(2)}</span>
      </div>
      ` : ""}
      <div class="totals-row total">
        <span>Total:</span>
        <span>${invoice.currency} ${invoice.totalAmount.toFixed(2)}</span>
      </div>
      ${invoice.paidAmount > 0 ? `
      <div class="totals-row">
        <span>Paid:</span>
        <span>${invoice.currency} ${invoice.paidAmount.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Balance:</span>
        <span>${invoice.currency} ${(invoice.totalAmount - invoice.paidAmount).toFixed(2)}</span>
      </div>
      ` : ""}
    </div>

    ${invoice.notes || invoice.paymentTerms ? `
    <div class="notes-section">
      ${invoice.paymentTerms ? `<p><strong>Payment Terms:</strong> ${invoice.paymentTerms}</p>` : ""}
      ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ""}
    </div>
    ` : ""}
  </div>
</body>
</html>
  `;
};

/**
 * Create invoice from customer order
 */
export const createInvoiceFromOrder = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    let companyId = decodedToken.companyId;
    let employeeId = decodedToken.employeeId || decodedToken.userId;
    
    // If companyId is not in token, try to get it from user's company
    if (!companyId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee) {
          if (!employeeId) employeeId = employee._id;
          if (employee.company) {
            companyId = employee.company;
          } else if (employee.companyId) {
            companyId = employee.companyId;
          }
        }
      } catch (err) {
        console.error("Error fetching employee company:", err);
      }
    }
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const { orderId } = req.body;

    const order = await CustomerOrder.findOne({
      _id: orderId,
      companyId,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Convert order items to invoice items
    const invoiceItems = order.items.map((item) => ({
      description: item.product?.name || "Product",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      taxRate: 0, // Can be configured
      total: item.totalPrice,
    }));

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(companyId);

    // Create invoice
    const invoice = new Invoice({
      companyId,
      invoiceNumber,
      customerId: order.customer,
      orderId: order._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      items: invoiceItems,
      globalDiscount: {
        type: "percentage",
        value: order.globalDiscount || 0,
      },
      taxRate: 0, // Can be configured
      notes: order.notes || "",
      paymentTerms: "Net 30",
      createdBy: employeeId,
      status: "Draft",
    });

    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customerId", "name email phone address")
      .populate("orderId")
      .populate("createdBy", "name email")
      .populate("companyId", "name email phone address logo");

    // Send invoice email automatically - Nexora sends to customer only
    try {
      await sendInvoiceEmail(populatedInvoice, false); // sendToCompany = false for Nexora (send to customer)
    } catch (emailError) {
      console.error("❌ Error sending invoice email (invoice still created):", emailError.message);
      // Don't fail invoice creation if email fails
    }

    return res.status(201).json({
      success: true,
      data: populatedInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice from order:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating invoice from order",
      error: error.message,
    });
  }
};

