import Procurement from "../models/procurement.model.js";
import Supplier from "../models/suppliers.model.js";
import Company from "../models/companies.model.js";
import Product from "../models/product.model.js";
import Inventory from "../models/inventory.model.js";
import InventoryHistory from "../models/InventoryHistory.model.js";
import Finance from "../models/finance.model.js";
import Warehouse from "../models/warehouse.model.js";
import SupplySchedule from "../models/SupplySchedule.model.js";
import {
  sendProcurementEmailWithPDF,
  sendProcurementDiscrepancyEmail,
} from "../emails/emailService.js";

import jwt from "jsonwebtoken";
import axios from "axios";
import mongoose from "mongoose";
import cloudinary, {
  extractPublicId,
  uploadToCloudinaryFile,
} from "../config/lib/cloudinary.js";

const normalizeShippingAddress = (
  address = {},
  fallbackStreet = "",
  fallbackContactName = "",
  fallbackContactPhone = ""
) => {
  if (!address || typeof address !== "object") {
    address = {};
  }

  const normalized = {
    street: (address.street || fallbackStreet || "").trim(),
    city: (address.city || "").trim(),
    state: (address.state || "").trim(),
    country: (address.country || "").trim(),
    zipCode: (address.zipCode || "").trim(),
    contactName: (address.contactName || fallbackContactName || "").trim(),
    contactPhone: (address.contactPhone || fallbackContactPhone || "").trim(),
  };

  const hasValue = Object.values(normalized).some((value) =>
    typeof value === "string" ? value.length > 0 : Boolean(value)
  );

  return hasValue ? normalized : null;
};

// פונקציה ליצירת מספר schedule ייחודי
const generateScheduleNumber = async (companyId) => {
  try {
    const year = new Date().getFullYear();
    const prefix = `SS-${year}-`;
    
    // המרת companyId ל-ObjectId אם צריך
    const companyIdObj = mongoose.Types.ObjectId.isValid(companyId) 
      ? (typeof companyId === 'string' ? new mongoose.Types.ObjectId(companyId) : companyId)
      : companyId;
    
    const lastSchedule = await SupplySchedule.findOne({
      companyId: companyIdObj,
      scheduleNumber: new RegExp(`^${prefix}`),
    })
      .sort({ scheduleNumber: -1 })
      .limit(1);
    
    let sequence = 1;
    if (lastSchedule && lastSchedule.scheduleNumber) {
      const parts = lastSchedule.scheduleNumber.split("-");
      const lastSeq = parseInt(parts[2] || "0");
      sequence = lastSeq + 1;
    }
    
    return `${prefix}${sequence.toString().padStart(6, "0")}`;
  } catch (error) {
    console.error("❌ Error generating schedule number:", error);
    // Fallback - use timestamp if generation fails
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `SS-${year}-${timestamp}`;
  }
};

// Create a new procurement
export const createProcurementRecord = async (req, res) => {
  // בדיקה ש-req.user קיים
  if (!req.user || !req.user.companyId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - User not authenticated",
    });
  }
  
  const companyId = req.user.companyId;

  const {
    PurchaseOrder,
    supplierId,
    supplierName,
    warehouseId,
    products,
    PaymentMethod,
    PaymentTerms,
    DeliveryAddress,
    ShippingMethod,
    purchaseDate,
    deliveryDate,
    orderStatus,
    approvalStatus,
    notes,
    paymentStatus,
    shippingCost,
    currency,
    requiresCustoms,
    warrantyExpiration,
    receivedDate,
    totalCost,
    summeryProcurement,
    currentSignatures,
    currentSignerIndex,
    signers,
    status,
    statusUpdate,
    shippingAddress,
    contactPerson,
    contactPhone,
  } = req.body;

  console.log("Received procurement data:", req.body);
  console.log("📦 WarehouseId received:", warehouseId, "Type:", typeof warehouseId);

  const normalizedShippingAddress = normalizeShippingAddress(
    shippingAddress,
    typeof DeliveryAddress === "string" ? DeliveryAddress : "",
    contactPerson,
    contactPhone
  );

  const effectiveDeliveryAddress =
    (normalizedShippingAddress && normalizedShippingAddress.street) ||
    (typeof DeliveryAddress === "string" ? DeliveryAddress.trim() : "");

  if (
    !PurchaseOrder ||
    !companyId ||
    !supplierId ||
    !warehouseId ||
    !PaymentMethod ||
    !PaymentTerms ||
    !products ||
    products.length === 0 ||
    !effectiveDeliveryAddress ||
    !totalCost ||
    !summeryProcurement
  ) {
    return res.status(400).json({
      success: false,
      message:
        "All required fields must be provided, including products, supplier details, warehouse, delivery address, and summary.",
    });
  }

  try {
    // Validate products
    const validatedProducts = products.map((product) => {
      const { productId, productName, sku, category, unitPrice, quantity } =
        product;

      if (
        !productId ||
        !productName ||
        !sku ||
        !category ||
        !unitPrice ||
        !quantity
      ) {
        throw new Error(
          "Each product must include productName, SKU, category, unitPrice, and quantity."
        );
      }

      return {
        ...product,
        productId,
        unitPrice: parseFloat(unitPrice),
        quantity: parseInt(quantity, 10),
        total: parseFloat(unitPrice) * parseInt(quantity, 10),
      };
    });

    // Upload PDF
    let summeryProcurementUrl = "";
    try {
      // בדיקה שהקובץ קיים ולא ריק
      if (!summeryProcurement) {
        console.error("❌ Error: summeryProcurement is missing");
        return res.status(400).json({
          success: false,
          message: "PDF summary is required and cannot be empty.",
        });
      }

      // בדיקה שהקובץ הוא string
      if (typeof summeryProcurement !== 'string') {
        console.error("❌ Error: summeryProcurement is not a string, type:", typeof summeryProcurement);
        return res.status(400).json({
          success: false,
          message: "PDF summary must be a string in base64 format.",
        });
      }

      // בדיקה שהקובץ לא ריק
      const trimmedProcurement = summeryProcurement.trim();
      if (trimmedProcurement.length === 0) {
        console.error("❌ Error: summeryProcurement is empty after trim");
        return res.status(400).json({
          success: false,
          message: "PDF summary is required and cannot be empty.",
        });
      }

      // בדיקה שהקובץ בפורמט base64 או data URL
      const isBase64OrDataUrl = trimmedProcurement.startsWith('data:') || trimmedProcurement.length > 100;
      
      if (!isBase64OrDataUrl) {
        console.error("❌ Error: summeryProcurement is not in valid format. Length:", trimmedProcurement.length);
        return res.status(400).json({
          success: false,
          message: "PDF summary must be in base64 format.",
        });
      }

      console.log("📤 Attempting to upload PDF to Cloudinary...");
      console.log("📊 PDF data info:", {
        length: trimmedProcurement.length,
        startsWithData: trimmedProcurement.startsWith('data:'),
        firstChars: trimmedProcurement.substring(0, 50)
      });

      const uploadResult = await uploadToCloudinaryFile(trimmedProcurement);
      summeryProcurementUrl = uploadResult.secure_url;
      console.log("✅ PDF uploaded successfully:", summeryProcurementUrl);
    } catch (uploadError) {
      console.error("❌ Error uploading summary:", uploadError);
      console.error("Upload error details:", {
        message: uploadError.message,
        stack: uploadError.stack,
        name: uploadError.name,
        http_code: uploadError.http_code,
        response: uploadError.response
      });
      return res.status(500).json({
        success: false,
        message: `Failed to upload PDF summary: ${uploadError.message || 'Unknown error'}`,
        error: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
      });
    }

    // Save procurement record
    const newProcurementRecord = new Procurement({
      companyId,
      PurchaseOrder,
      supplierId,
      supplierName,
      warehouseId,
      products: validatedProducts,
      PaymentMethod,
      PaymentTerms,
      DeliveryAddress: effectiveDeliveryAddress,
      ShippingMethod,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      orderStatus,
      approvalStatus,
      notes,
      paymentStatus,
      shippingCost: parseFloat(shippingCost) || 0,
      currency: currency || "USD",
      requiresCustoms: !!requiresCustoms,
      warrantyExpiration: warrantyExpiration
        ? new Date(warrantyExpiration)
        : null,
      receivedDate: receivedDate ? new Date(receivedDate) : null,
      totalCost: parseFloat(totalCost) + (parseFloat(shippingCost) || 0), // Include shipping cost in total
      summeryProcurement: summeryProcurementUrl,
      currentSignatures: currentSignatures || 0,
      currentSignerIndex: currentSignerIndex || 0,
      signers: Array.isArray(signers) ? signers : [],
      status: status || "pending",
      statusUpdate: statusUpdate || null,
      shippingAddress: normalizedShippingAddress,
      contactPerson: contactPerson || normalizedShippingAddress?.contactName,
      contactPhone: contactPhone || normalizedShippingAddress?.contactPhone,
    });

    const savedProcurementRecord = await newProcurementRecord.save();

    // יצירת רשומה פיננסית אוטומטית
    try {
      // המרת PaymentTerms מ-Procurement ל-Finance
      const mapPaymentTerms = (procurementTerms) => {
        const mapping = {
          "Due on receipt": "Immediate",
          "Net 30 days": "Net 30",
          "Net 45 days": "Net 45",
          "Net 60 days": "Net 60",
        };
        return mapping[procurementTerms] || "Net 30";
      };

      // קביעת סטטוס התשלום
      let financeStatus = "Pending";
      if (paymentStatus === "Paid") {
        financeStatus = "Completed";
      } else if (paymentStatus === "Partial") {
        financeStatus = "Pending";
      }

      // יצירת תיאור מפורט
      const productsDescription = validatedProducts
        .map((p) => `${p.productName} (${p.quantity}x ${p.unitPrice})`)
        .join(", ");
      const financeDescription = `תעודת רכש ${PurchaseOrder} - ${supplierName}${productsDescription ? `: ${productsDescription}` : ""}`;

      const financeRecord = new Finance({
        companyId,
        transactionType: "Expense",
        category: "Procurement",
        transactionAmount: parseFloat(totalCost) + (parseFloat(shippingCost) || 0), // totalCost already includes shipping
        transactionDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        transactionCurrency: currency || "USD",
        transactionDescription: financeDescription,
        bankAccount: PaymentMethod || "Bank Transfer",
        transactionStatus: financeStatus,
        recordType: "supplier",
        partyId: supplierId,
        invoiceNumber: PurchaseOrder,
        paymentTerms: mapPaymentTerms(PaymentTerms),
        otherDetails: `יוצר אוטומטית מתעודת רכש ${PurchaseOrder}.${notes ? ` הערות: ${notes}` : ""}${shippingCost ? ` עלות משלוח: ${shippingCost} ${currency || "USD"}` : ""}`,
        attachmentURL: summeryProcurementUrl ? [summeryProcurementUrl] : [],
      });

      await financeRecord.save();
      console.log(`✅ Created finance record ${financeRecord._id} for procurement ${PurchaseOrder}`);
    } catch (financeError) {
      console.error("⚠️  Error creating finance record:", financeError);
      console.error("Finance error details:", financeError.message);
      // לא נכשיל את כל הפעולה אם הרשומה הפיננסית נכשלה
    }

    // יצירת רשומה בלוח זמנים לאספקה
    try {
      console.log("🔄 Starting supply schedule creation...");
      
      // בדיקות לפני יצירה
      if (!savedProcurementRecord || !savedProcurementRecord._id) {
        throw new Error("Procurement record was not saved properly");
      }
      
      if (!supplierId || !supplierName) {
        throw new Error("Supplier information is missing");
      }
      
      if (!validatedProducts || validatedProducts.length === 0) {
        throw new Error("No products to schedule");
      }
      
      // יצירת מספר schedule ייחודי
      const scheduleNumber = await generateScheduleNumber(companyId);
      console.log("✅ Generated schedule number:", scheduleNumber);
      
      // הכנת פריטים ל-SupplySchedule
      const scheduleItems = validatedProducts.map((product) => {
        // המרת productId ל-ObjectId אם צריך
        let productIdValue = product.productId;
        if (mongoose.Types.ObjectId.isValid(product.productId)) {
          productIdValue = typeof product.productId === 'string' 
            ? new mongoose.Types.ObjectId(product.productId) 
            : product.productId;
        } else {
          console.warn("⚠️ Invalid productId format:", product.productId);
        }
        
        return {
          productId: productIdValue,
          productName: product.productName,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          totalPrice: product.total,
        };
      });
      
      console.log(`✅ Prepared ${scheduleItems.length} schedule items`);
      
      // הכנת תאריך אספקה
      const effectiveDeliveryDate = deliveryDate 
        ? new Date(deliveryDate) 
        : (purchaseDate ? new Date(purchaseDate) : new Date());
      
      // הכנת פריטים ללוח הזמנים
      const scheduleEntryItems = validatedProducts.map((product) => {
        let productIdValue = product.productId;
        if (mongoose.Types.ObjectId.isValid(product.productId)) {
          productIdValue = typeof product.productId === 'string' 
            ? new mongoose.Types.ObjectId(product.productId) 
            : product.productId;
        }
        
        return {
          productId: productIdValue,
          productName: product.productName,
          quantity: product.quantity,
          receivedQuantity: 0,
          status: "Scheduled",
        };
      });
      
      // יצירת entry בלוח הזמנים
      const scheduleEntry = {
        deliveryDate: effectiveDeliveryDate,
        items: scheduleEntryItems,
        tracking: {
          carrier: ShippingMethod || null,
          trackingNumber: null,
          estimatedDelivery: deliveryDate ? new Date(deliveryDate) : null,
          actualDelivery: null,
          status: "Pending",
        },
        alerts: [],
      };
      
      console.log("✅ Prepared schedule entry with", scheduleEntryItems.length, "items");
      
      // הכנת נתונים ל-SupplySchedule
      const supplyScheduleData = {
        companyId: mongoose.Types.ObjectId.isValid(companyId) 
          ? (typeof companyId === 'string' ? new mongoose.Types.ObjectId(companyId) : companyId)
          : companyId,
        scheduleNumber,
        procurementId: savedProcurementRecord._id,
        supplierId: mongoose.Types.ObjectId.isValid(supplierId) 
          ? (typeof supplierId === 'string' ? new mongoose.Types.ObjectId(supplierId) : supplierId)
          : supplierId,
        supplierName,
        items: scheduleItems,
        schedule: [scheduleEntry],
        status: "Scheduled",
        startDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        endDate: deliveryDate ? new Date(deliveryDate) : null,
        notes: notes || `נוצר אוטומטית מתעודת רכש ${PurchaseOrder}`,
      };
      
      // הוספת createdBy ו-managedBy אם קיימים
      if (req.user?._id) {
        supplyScheduleData.createdBy = req.user._id;
        supplyScheduleData.managedBy = req.user._id;
      }
      
      console.log("🔄 Creating SupplySchedule with data:", {
        companyId: supplyScheduleData.companyId?.toString(),
        scheduleNumber: supplyScheduleData.scheduleNumber,
        procurementId: supplyScheduleData.procurementId?.toString(),
        supplierId: supplyScheduleData.supplierId?.toString(),
        itemsCount: supplyScheduleData.items?.length,
        scheduleCount: supplyScheduleData.schedule?.length,
      });
      
      // יצירת SupplySchedule
      const supplySchedule = new SupplySchedule(supplyScheduleData);
      
      // בדיקת validation לפני שמירה
      const validationError = supplySchedule.validateSync();
      if (validationError) {
        console.error("❌ SupplySchedule validation error:", validationError);
        throw validationError;
      }
      
      // שמירה
      await supplySchedule.save();
      console.log(`✅ Created supply schedule ${scheduleNumber} for procurement ${PurchaseOrder}`);
      
    } catch (scheduleError) {
      console.error("⚠️  Error creating supply schedule:", scheduleError);
      console.error("Schedule error details:", {
        message: scheduleError.message,
        name: scheduleError.name,
        code: scheduleError.code,
        errors: scheduleError.errors,
        stack: scheduleError.stack
      });
      // לא נכשיל את כל הפעולה אם יצירת לוח הזמנים נכשלה
      // המשתמש עדיין יקבל את תעודת הרכש
    }

    res.status(201).json({ success: true, data: savedProcurementRecord });
  } catch (error) {
    console.error("❌ Error creating procurement record:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: "Error creating procurement record",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Pull all procurement records
export const getAllProcurementRecords = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const procurementRecords = await Procurement.find({ companyId })
      .sort({ PurchaseOrder: 1 })
      .populate("companyId", "CompanyName");

    res.status(200).json({ success: true, data: procurementRecords });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving procurement records" + error.message,
      error: error.message,
    });
  }
};

// Pull procurement record by id
export const getProcurementRecordById = async (req, res) => {
  try {
    const { purchaseOrder } = req.params; // הנה השליפה הנכונה של purchaseOrder
    const procurementRecord = await Procurement.findOne({
      PurchaseOrder: purchaseOrder,
    });
    if (!procurementRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement record not found" });
    }
    res.status(200).json({ success: true, data: procurementRecord });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving procurement record",
      error: error.message,
    });
  }
};

export const signProcurement = async (req, res) => {
  console.log("📝 signProcurement called with:", {
    id: req.params.id,
    employeeId: req.body.employeeId,
    hasSignature: !!req.body.signature,
    companyId: req.user?.companyId,
    hasUser: !!req.user,
  });

  // בדיקה ש-req.user קיים
  if (!req.user || !req.user.companyId) {
    console.error("❌ req.user or companyId is missing");
    return res.status(401).json({
      success: false,
      message: "Unauthorized - User not authenticated",
    });
  }

  const companyId = req.user.companyId;
  const { id } = req.params;
  const { employeeId, signature } = req.body; // המשתמש שמנסה לחתום

  try {
    // בדיקות בסיסיות
    if (!employeeId) {
      console.error("❌ Employee ID is missing");
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    if (!signature) {
      console.error("❌ Signature data is missing");
      return res.status(400).json({
        success: false,
        message: "Signature data is required",
      });
    }

    const procurement = await Procurement.findById(id);
    console.log("📦 Procurement found:", {
      id: procurement?._id,
      hasWarehouseId: !!procurement?.warehouseId,
      signersCount: procurement?.signers?.length,
    });
    if (!procurement) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement not found" });
    }

    // בדיקה שה-procurement שייך ל-companyId של המשתמש
    if (procurement.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to sign this procurement",
      });
    }

    // העלאת החתימה ל-Cloudinary
    let uploadResponse;
    try {
      console.log("☁️ Uploading signature to Cloudinary...");
      uploadResponse = await cloudinary.uploader.upload(signature, {
      folder: "signatures",
      public_id: `signature_${id}_${employeeId}`,
        resource_type: "image",
      });
      console.log("✅ Signature uploaded successfully:", uploadResponse.secure_url);
    } catch (uploadError) {
      console.error("❌ Error uploading signature to Cloudinary:", uploadError);
      console.error("Upload error details:", {
        message: uploadError.message,
        http_code: uploadError.http_code,
        name: uploadError.name,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to upload signature",
        error: uploadError.message,
      });
    }

    // בדיקה שיש signers
    if (!procurement.signers || procurement.signers.length === 0) {
      console.error("❌ No signers found in procurement");
      return res.status(400).json({
        success: false,
        message: "No signers found in this procurement.",
      });
    }

    procurement.signers.sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log("👥 Signers list:", procurement.signers.map(s => ({
      employeeId: s.employeeId?.toString(),
      order: s.order,
      hasSigned: s.hasSigned,
    })));

    const signerInList = procurement.signers.find(
      (signer) => {
        const signerEmployeeId = signer.employeeId?.toString();
        const requestedEmployeeId = employeeId.toString();
        return signerEmployeeId === requestedEmployeeId;
      }
    );
    
    if (!signerInList) {
      console.error("❌ Employee not in signers list:", {
        requestedEmployeeId: employeeId,
        availableSigners: procurement.signers.map(s => s.employeeId?.toString()),
      });
      return res.status(400).json({
        success: false,
        message: "You are not in the signers list for this procurement.",
      });
    }

    if (signerInList.hasSigned) {
      console.warn("⚠️ Employee already signed");
      return res.status(400).json({
        success: false,
        message: "You have already signed this procurement.",
      });
    }

    const nextSigner = procurement.signers.find(
      (signer) => signer.order === procurement.currentSignerIndex
    );

    if (!nextSigner) {
      console.error("❌ No next signer found:", {
        currentSignerIndex: procurement.currentSignerIndex,
        signers: procurement.signers.map(s => ({ order: s.order, employeeId: s.employeeId?.toString() })),
      });
      return res.status(400).json({
        success: false,
        message: "No next signer found or invalid order state.",
      });
    }

    if (nextSigner.employeeId?.toString() !== employeeId.toString()) {
      console.warn("⚠️ Not user's turn to sign:", {
        nextSignerEmployeeId: nextSigner.employeeId?.toString(),
        requestedEmployeeId: employeeId.toString(),
      });
      return res.status(400).json({
        success: false,
        message: "It is not your turn to sign yet. Please wait for your turn.",
      });
    }
    
    const signerIndex = procurement.signers.findIndex(
      (signer) => signer.employeeId?.toString() === employeeId.toString()
    );

    if (signerIndex === -1) {
      console.error("❌ Signer index not found");
      return res.status(400).json({
        success: false,
        message: "Signer not found in the list.",
      });
    }
    
    console.log("✅ All validations passed, updating signature...");
    procurement.signers[signerIndex].signatureUrl = uploadResponse.secure_url;

    signerInList.hasSigned = true;
    signerInList.timeStamp = new Date();

    procurement.currentSignatures += 1;
    procurement.currentSignerIndex = procurement.currentSignatures;

    if (procurement.currentSignatures === procurement.signers.length) {
      console.log("🎉 All signers have signed, updating status and sending email...");
      procurement.status = "completed";
      procurement.approvalStatus = "Approved";
      procurement.approvedAt = new Date();
      
      // שליחת אימייל - לא נכשיל את החתימה אם זה נכשל
      try {
      const supplierDetails = await Supplier.findById(procurement.supplierId);
      const companyDetails = await Company.findById(companyId);

      if (!supplierDetails || !supplierDetails.Email) {
          console.warn("⚠️ Supplier details or email not found - skipping email");
        } else if (!companyDetails || !companyDetails.name) {
          console.warn("⚠️ Company details or name not found - skipping email");
        } else if (!procurement.summeryProcurement) {
          console.warn("⚠️ PDF data is missing - skipping email");
        } else {
      let pdfBuffer = null;
      try {
        if (
          typeof procurement.summeryProcurement === "string" &&
          procurement.summeryProcurement.startsWith("http")
        ) {
          const response = await axios.get(procurement.summeryProcurement, {
            responseType: "arraybuffer",
          });
          pdfBuffer = Buffer.from(response.data);
        } else {
          pdfBuffer = Buffer.from(procurement.summeryProcurement, "base64");
      }

        await sendProcurementEmailWithPDF(
          supplierDetails.Email,
          supplierDetails.SupplierName,
          companyDetails.name,
          procurement.summeryProcurement,
          pdfBuffer
        );
            console.log("✅ Procurement email sent successfully.");
          } catch (emailOrBufferError) {
            // טיפול בשגיאות של buffer או email
            if (emailOrBufferError.message?.includes("buffer") || emailOrBufferError.message?.includes("PDF")) {
              console.error("⚠️ Failed to prepare procurement PDF buffer:", emailOrBufferError);
            } else {
              console.error("⚠️ Error sending procurement email:", emailOrBufferError.message);
              console.error("Error details:", emailOrBufferError);
            }
            // לא נכשיל את החתימה
          }
        }
      } catch (emailSetupError) {
        console.error("⚠️ Error setting up email:", emailSetupError);
        // לא נכשיל את החתימה
      }
    }

    // אם warehouseId חסר, ננסה למצוא מחסן ברירת מחדל
    // אבל לא נכשיל את החתימה אם אין מחסן - זה לא חובה לחתימה
    if (!procurement.warehouseId) {
      console.log("⚠️ Procurement missing warehouseId, attempting to find default warehouse");
      try {
        const defaultWarehouse = await Warehouse.findOne({
          companyId: companyId,
          status: "operational"
        }).sort({ createdAt: 1 });
        
        if (defaultWarehouse) {
          procurement.warehouseId = defaultWarehouse._id;
          console.log(`✅ Using default warehouse: ${defaultWarehouse.name}`);
        } else {
          console.warn("⚠️ No default warehouse found for company - signature will proceed without warehouseId");
          // לא נכשיל את החתימה - warehouseId לא חובה לחתימה
          // אבל נשמור את זה ב-procurement ללא warehouseId (אם המודל מאפשר)
        }
      } catch (warehouseError) {
        console.error("Error finding default warehouse:", warehouseError);
        // לא נכשיל את החתימה - רק נוסיף לוג
      }
    }

    // שמירת ה-procurement
    try {
    await procurement.save();
    } catch (saveError) {
      console.error("Error saving procurement after signature:", saveError);
      console.error("Save error details:", {
        message: saveError.message,
        name: saveError.name,
        errors: saveError.errors,
      });
      // אם יש בעיה עם ה-save, ננסה למחוק את החתימה שהועלתה ל-Cloudinary
      try {
        if (uploadResponse?.public_id) {
          await cloudinary.uploader.destroy(uploadResponse.public_id);
        }
      } catch (deleteError) {
        console.error("Error deleting uploaded signature:", deleteError);
      }
      return res.status(500).json({
        success: false,
        message: "Failed to save procurement signature",
        error: saveError.message,
        validationErrors: saveError.errors ? Object.keys(saveError.errors) : undefined,
      });
    }

    return res.status(200).json({
      success: true,
      data: procurement,
      signatureUrl: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error("Error signing procurement:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error signing procurement",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
export const getAllSignatures = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    const companyId = decodedToken.companyId;
    const documents = await Procurement.find({
      companyId,
    });

    if (!documents || documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No documents found.",
      });
    }

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents.",
    });
  }
};
export const getEmployeeSignatures = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const employeeId = decodedToken?.employeeId;
  console.log("Employee ID from token:", employeeId);

  try {
    // מוצא את כל תעודות הרכש שבהן קיים signer עם employeeId זהה
    const procurements = await Procurement.find({
      "signers.employeeId": employeeId,
    }).populate("signers.employeeId", "name");

    if (!procurements || procurements.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No signatures found for this employee.",
      });
    }

    const employeeSignatures = procurements.map((procurement) => {
      // מסנן את כל החותמים שתואמים ל-employeeId מהטוקן
      const matchingSigners = procurement.signers.filter((s) => {
        let id;
        if (
          s.employeeId &&
          typeof s.employeeId === "object" &&
          s.employeeId._id
        ) {
          id = s.employeeId._id.toString();
        } else if (s.employeeId) {
          id = s.employeeId.toString();
        }
        return id === employeeId;
      });

      return {
        purchaseOrder: procurement.PurchaseOrder || "N/A",
        supplierName: procurement.supplierName || "N/A",
        approvalStatus: procurement.approvalStatus || "Pending",
        signers: matchingSigners.map((signer) => ({
          name:
            (signer.employeeId && signer.employeeId.name) ||
            signer.name ||
            "Unknown",
          hasSigned: signer.hasSigned,
          signatureUrl: signer.signatureUrl,
        })),
        documentUrl: procurement.summeryProcurement || null,
        status: procurement.status || "Pending",
      };
    });

    res.status(200).json({ success: true, data: employeeSignatures });
  } catch (error) {
    console.error("Error fetching employee signatures:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee signatures.",
    });
  }
};

// Update procurement record by allowed fields
export const updateProcurementRecord = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  if (!decodedToken || !decodedToken.companyId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const companyId = decodedToken.companyId;
  const updates = req.body;
  const procurementId = req.params.id;

  // רשימת כל השדות שמותר לעדכן
  const allowedUpdates = [
    "supplierName",
    "PurchaseOrder",
    "warehouseId",
    "products", // מערך מוצרים
    "PaymentMethod",
    "PaymentTerms",
    "DeliveryAddress",
    "shippingAddress",
    "ShippingMethod",
    "purchaseDate",
    "deliveryDate",
    "orderStatus",
    "approvalStatus",
    "notes",
    "paymentStatus",
    "shippingCost",
    "currency",
    "requiresCustoms",
    "warrantyExpiration",
    "receivedDate",
    "totalCost",
    "signers", // מערך של חותמים
    "status",
    "summeryProcurement",
    "summeryProcurementUrl",
    "currentSignatures",
    "currentSignerIndex",
    "statusUpdate",
    "contactPerson",
    "contactPhone",
  ];

  const pro = await Procurement.findById(procurementId);
  let summeryProcurementUrl = "";

  // אם ה-PDF נשלח, העלה אותו ל-Cloudinary
  if (updates.summeryProcurement) {
    if (pro?.summeryProcurement) {
      const publicId = extractPublicId(pro.summeryProcurement);
      if (publicId) {
        const deletionResult = await cloudinary.uploader.destroy(publicId);
        console.log("Deletion result:", deletionResult);
      } else {
        console.log("Could not extract public_id from URL");
      }
    }

    try {
      const uploadResult = await uploadToCloudinaryFile(
        updates.summeryProcurement,
        "procurement_pdfs" // ציון התיקייה ב-Cloudinary
      );
      summeryProcurementUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error("Error uploading summary:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload PDF summary.",
      });
    }
  }

  // סינון השדות המותרים לעדכון
  const sanitizedUpdates = Object.keys(updates)
    .filter((key) => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      if (key === "summeryProcurement" && summeryProcurementUrl) {
        obj["summeryProcurement"] = summeryProcurementUrl;
      } else if (key === "shippingAddress") {
        obj[key] = normalizeShippingAddress(
          updates.shippingAddress,
          updates.DeliveryAddress || pro?.DeliveryAddress || "",
          updates.contactPerson || pro?.contactPerson || "",
          updates.contactPhone || pro?.contactPhone || ""
        );
      } else if (key !== "summeryProcurement") {
        obj[key] = updates[key];
      }
      return obj;
    }, {});

  if (
    sanitizedUpdates.shippingAddress &&
    typeof sanitizedUpdates.shippingAddress === "object" &&
    !sanitizedUpdates.DeliveryAddress
  ) {
    sanitizedUpdates.DeliveryAddress =
      sanitizedUpdates.shippingAddress.street || pro?.DeliveryAddress || "";
  }

  console.log("Sanitized updates:", sanitizedUpdates);

  try {
    const updatedProcurementRecord = await Procurement.findOneAndUpdate(
      { _id: procurementId, companyId },
      sanitizedUpdates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProcurementRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement record not found" });
    }

    res.status(200).json({ success: true, data: updatedProcurementRecord });
  } catch (error) {
    console.error("Error updating procurement record:", error);
    res.status(500).json({
      success: false,
      message: "Error updating procurement record",
      error: error.message,
    });
  }
};

// Delete procurement record by id
export const deleteProcurementRecord = async (req, res) => {
  try {
    const deletedProcurementRecord = await Procurement.findByIdAndDelete(
      req.params.id
    );
    if (!deletedProcurementRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement record not found" });
    }
    res.status(200).json({
      success: true,
      message: "Procurement record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting procurement record",
      error: error.message,
    });
  }
};

export const exportProcurementsToCSV = async (req, res) => {
  try {
    const procurements = await Procurement.find();
    const fields = [
      "PurchaseOrder",
      "supplierName",
      "totalCost",
      "purchaseDate",
      "orderStatus",
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(procurements);

    res.header("Content-Type", "text/csv");
    res.attachment("procurements.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting procurements",
      error: error.message,
    });
  }
};

export const searchProcurements = async (req, res) => {
  const { startDate, endDate, supplierName, orderStatus } = req.query;

  const filter = {};
  if (startDate && endDate) {
    filter.purchaseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  if (supplierName) {
    filter.supplierName = { $regex: supplierName, $options: "i" };
  }
  if (orderStatus) {
    filter.orderStatus = orderStatus;
  }

  try {
    const procurements = await Procurement.find(filter);
    res.status(200).json({ success: true, data: procurements });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching procurements",
      error: error.message,
    });
  }
};
export const receivedOrder = async (req, res) => {
  console.log("📦 receivedOrder called with:", {
    id: req.params.id,
    hasReceivedQuantities: !!req.body.receivedQuantities,
    receivedQuantitiesKeys: req.body.receivedQuantities ? Object.keys(req.body.receivedQuantities) : [],
    allowCloseWithDiscrepancy: req.body.allowCloseWithDiscrepancy,
    supplierRating: req.body.supplierRating,
  });

  const { id } = req.params;
  const {
    receivedQuantities,
    allowCloseWithDiscrepancy,
    additionalNotes,
    supplierRating,
  } = req.body;

  const token = req.cookies["auth_token"];
  if (!token) {
    console.error("❌ No auth token found");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  if (!decodedToken || !decodedToken.companyId) {
    console.error("❌ No companyId in token");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const companyId = decodedToken.companyId;

  try {
    // בדיקה ש-receivedQuantities קיים וזה object
    if (!receivedQuantities || typeof receivedQuantities !== "object") {
      console.error("❌ receivedQuantities is missing or invalid");
      return res.status(400).json({
        success: false,
        message: "Received quantities are required and must be an object",
      });
    }

    const procurement = await Procurement.findOne({
      _id: id,
      companyId,
    }).populate("products.productId");
    if (!procurement) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement not found" });
    }

    console.log("📦 Procurement found:", procurement._id);
    console.log("📦 Procurement warehouseId:", procurement.warehouseId);
    console.log("📦 Procurement warehouseId type:", typeof procurement.warehouseId);
    console.log("📦 Procurement products count:", procurement.products?.length || 0);

    // בדיקה שיש products
    if (!procurement.products || procurement.products.length === 0) {
      console.error("❌ No products found in procurement");
      return res.status(400).json({
        success: false,
        message: "No products found in this procurement",
      });
    }

    // ודא שיש warehouseId ב-procurement - אם חסר, ננסה למצוא מחסן ברירת מחדל
    let targetWarehouseId = procurement.warehouseId;
    
    if (!targetWarehouseId) {
      // ננסה למצוא מחסן ברירת מחדל של החברה
      const defaultWarehouse = await Warehouse.findOne({
        companyId: companyId,
        status: "operational"
      }).sort({ createdAt: 1 }); // המחסן הראשון שנוצר
      
      if (!defaultWarehouse) {
        return res.status(400).json({
          success: false,
          message: "Warehouse ID is missing in procurement record and no default warehouse found. Please update the procurement record with a warehouse ID.",
        });
      }
      
      // עדכן את ה-procurement עם המחסן שנמצא
      targetWarehouseId = defaultWarehouse._id;
      procurement.warehouseId = targetWarehouseId;
      await procurement.save();
      
      console.log(`⚠️ Procurement ${procurement._id} was missing warehouseId. Using default warehouse: ${defaultWarehouse.name}`);
    }

    // המרת targetWarehouseId ל-ObjectId אם צריך (לפני הלולאה)
    let warehouseIdValue = targetWarehouseId;
    try {
      if (typeof targetWarehouseId === "string") {
        warehouseIdValue = new mongoose.Types.ObjectId(targetWarehouseId);
        console.log(`✅ Converted warehouseId from string to ObjectId: ${warehouseIdValue}`);
      } else if (targetWarehouseId && targetWarehouseId.toString) {
        // אם זה כבר ObjectId, נשתמש בו ישירות
        warehouseIdValue = targetWarehouseId;
        console.log(`✅ Using warehouseId as ObjectId: ${warehouseIdValue}`);
      } else {
        throw new Error(`Invalid warehouseId type: ${typeof targetWarehouseId}`);
      }
      
      // בדיקה ש-warehouseIdValue תקין על ידי המרה ל-string
      const warehouseIdStr = warehouseIdValue.toString();
      console.log(`✅ WarehouseId validated: ${warehouseIdStr}`);
      
      // בדיקה שהמחסן קיים
      const warehouseExists = await Warehouse.findById(warehouseIdValue);
      if (!warehouseExists) {
        console.error(`❌ Warehouse ${warehouseIdStr} not found`);
        return res.status(400).json({
          success: false,
          message: `Warehouse with ID ${warehouseIdStr} not found`,
        });
      }
      console.log(`✅ Warehouse exists: ${warehouseExists.name}`);
    } catch (warehouseIdError) {
      console.error("❌ Invalid warehouseId format:", warehouseIdError);
      return res.status(400).json({
        success: false,
        message: `Invalid warehouse ID format: ${targetWarehouseId}. Error: ${warehouseIdError.message}`,
      });
    }

    // המרת companyId ל-ObjectId אם צריך (לפני הלולאה)
    let companyIdValue = companyId;
    if (typeof companyId === "string") {
      try {
        companyIdValue = new mongoose.Types.ObjectId(companyId);
        console.log(`✅ Converted companyId from string to ObjectId: ${companyIdValue}`);
      } catch (companyIdError) {
        console.error("❌ Invalid companyId format:", companyIdError);
        return res.status(400).json({
          success: false,
          message: `Invalid company ID format: ${companyId}`,
        });
      }
    } else if (companyId && companyId.toString) {
      companyIdValue = companyId;
      console.log(`✅ Using companyId as ObjectId: ${companyIdValue}`);
    }

    let hasDiscrepancy = false;

    for (const product of procurement.products) {
      if (!product.productId) {
        return res.status(400).json({
          success: false,
          message: `ProductId not found for product ${product.productName}`,
        });
      }

      // טיפול ב-productId - יכול להיות ObjectId או Object (אם populate)
      let productIdValue;
      try {
        if (product.productId && typeof product.productId === "object") {
          if (product.productId._id) {
            // אם זה Object (populate)
            productIdValue = product.productId._id;
          } else if (product.productId.toString) {
            // אם זה ObjectId ישיר
            productIdValue = product.productId;
          } else {
            throw new Error("Invalid productId object structure");
          }
        } else if (product.productId && product.productId.toString) {
          // אם זה ObjectId ישיר (לא populate)
          productIdValue = product.productId;
        } else {
          throw new Error("productId is not a valid ObjectId or object");
        }
      } catch (productIdError) {
        console.error(`❌ Error processing productId for ${product.productName}:`, productIdError);
        return res.status(400).json({
          success: false,
          message: `Invalid productId format for product "${product.productName}": ${productIdError.message}`,
        });
      }

      const productIdStr = productIdValue.toString();
      console.log(`🔍 Processing product: ${product.productName}, productId: ${productIdStr}, productId type: ${typeof productIdValue}`);
      const receivedQty = receivedQuantities[productIdStr];

      if (receivedQty === undefined) {
        return res.status(400).json({
          success: false,
          message: `Received quantity for product "${product.productName}" is missing.`,
        });
      }

      if (isNaN(receivedQty) || receivedQty < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid received quantity for product "${product.productName}".`,
        });
      }

      const maxReceivableQty =
        product.quantity - (product.receivedQuantity || 0);
      if (receivedQty > maxReceivableQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot receive more than ordered. Product "${product.productName}" - Ordered: ${product.quantity}, Already Received: ${product.receivedQuantity}, Attempted: ${receivedQty}`,
        });
      }

      product.receivedQuantity = (product.receivedQuantity || 0) + receivedQty;
      if (receivedQty !== product.quantity) {
        hasDiscrepancy = true;
      }

      const productDoc = await Product.findById(productIdValue);
      if (!productDoc) {
        return res.status(400).json({
          success: false,
          message: `Product with id "${productIdStr}" not found.`,
        });
      }

      // בדיקה ש-warehouseIdValue תקין (כבר הומר לפני הלולאה)
      if (!warehouseIdValue) {
        console.error("❌ warehouseIdValue is missing or invalid");
        return res.status(400).json({
          success: false,
          message: "Warehouse ID is required to save inventory. Please update the procurement record with a warehouse ID.",
        });
      }

      // companyIdValue כבר הומר לפני הלולאה
      console.log(`🔍 Looking for inventory: productId=${productIdStr}, warehouseId=${warehouseIdValue}, companyId=${companyIdValue}`);
      
      // חיפוש ראשון: עם warehouseId המדויק
      let inventory = await Inventory.findOne({
        companyId: companyIdValue,
        productId: productIdValue,
        warehouseId: warehouseIdValue,
      });

      // אם לא נמצא, נחפש inventory בלי warehouseId (אולי יש inventory ישן בלי warehouseId)
      if (!inventory) {
        console.log(`🔍 Inventory not found with exact warehouseId, searching for inventory without warehouseId...`);
        inventory = await Inventory.findOne({
          companyId: companyIdValue,
          productId: productIdValue,
          $or: [
            { warehouseId: null },
            { warehouseId: { $exists: false } }
          ]
        });
        
        if (inventory) {
          console.log(`📦 Found existing inventory without warehouseId, updating with warehouseId: ${warehouseIdValue}`);
          inventory.warehouseId = warehouseIdValue;
        }
      }

      let oldQuantity = 0;
      if (!inventory) {
        console.log(`📦 Creating new inventory item for product ${product.productName} in warehouse ${warehouseIdValue}`);
        try {
          oldQuantity = 0; // אין כמות קודמת
        inventory = new Inventory({
            companyId: companyIdValue,
            productId: productIdValue,
            warehouseId: warehouseIdValue,
            quantity: Number(receivedQty),
            minStockLevel: 10, // Default value as per schema
            reorderQuantity: 20, // Default value as per schema
          });
          console.log(`📦 Inventory object created:`, {
            companyId: inventory.companyId?.toString(),
            productId: inventory.productId?.toString(),
            warehouseId: inventory.warehouseId?.toString(),
            quantity: inventory.quantity,
          });
        } catch (createError) {
          console.error(`❌ Error creating inventory object:`, createError);
          throw new Error(`Failed to create inventory object for product "${product.productName}": ${createError.message}`);
        }
      } else {
        oldQuantity = Number(inventory.quantity); // שמירת הכמות הישנה לפני העדכון
        console.log(`📦 Updating existing inventory for product ${product.productName}: ${oldQuantity} + ${receivedQty} = ${oldQuantity + Number(receivedQty)}`);
        inventory.quantity = oldQuantity + Number(receivedQty);
      }

      try {
        console.log(`💾 Attempting to save inventory for product ${product.productName}...`);
        const savedInventory = await inventory.save();
        console.log(`✅ Inventory saved successfully for product ${product.productName}:`, {
          id: savedInventory._id,
          quantity: savedInventory.quantity,
          warehouseId: savedInventory.warehouseId,
        });

        // יצירת רשומת היסטוריה
        try {
          await InventoryHistory.create({
            companyId: companyIdValue,
            productId: productIdValue,
            productName: product.productName,
            oldQuantity: oldQuantity,
            newQuantity: savedInventory.quantity,
            changeAmount: receivedQty,
            reason: "Procurement Received",
            type: "in",
            notes: `Received ${receivedQty} units from procurement order ${procurement.PurchaseOrder}`,
          });
          console.log(`✅ Inventory history created for product ${product.productName}`);
        } catch (historyError) {
          console.error(`⚠️ Error creating inventory history:`, historyError);
          // לא נכשיל את הפעולה אם יצירת ההיסטוריה נכשלה
        }
      } catch (inventorySaveError) {
        console.error(`❌ Error saving inventory for product ${product.productName}:`, inventorySaveError);
        console.error("Inventory save error details:", {
          message: inventorySaveError.message,
          name: inventorySaveError.name,
          errors: inventorySaveError.errors,
          stack: inventorySaveError.stack,
        });
        
        // נסה להבין מה הבעיה
        if (inventorySaveError.name === "ValidationError") {
          const validationErrors = Object.keys(inventorySaveError.errors || {}).map(key => ({
            field: key,
            message: inventorySaveError.errors[key].message,
          }));
          console.error("Validation errors:", validationErrors);
        }
        
        throw new Error(`Failed to save inventory for product "${product.productName}": ${inventorySaveError.message}`);
      }
    }

    // עדכן את ניצול המחסן (warehouseIdValue ו-companyIdValue כבר הומרו לפני הלולאה)
    try {
      const { updateWarehouseUtilization } = await import("../utils/warehouseUtilization.js");
      await updateWarehouseUtilization(warehouseIdValue, companyIdValue);
      console.log("✅ Warehouse utilization updated successfully");
    } catch (utilizationError) {
      console.error("⚠️ Error updating warehouse utilization:", utilizationError);
      console.error("Utilization error details:", {
        message: utilizationError.message,
        name: utilizationError.name,
      });
      // לא נכשיל את כל הפעולה אם עדכון הניצול נכשל
    }

    const supplier = await Supplier.findById(procurement.supplierId);
    if (!supplier) {
      return res
        .status(400)
        .json({ success: false, message: "Supplier not found" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: "Company not found" });
    }

    // חישוב הכמות הכוללת שהתקבלה עד כה עבור כל המוצרים
    const totalReceived = procurement.products.reduce(
      (sum, product) => sum + (product.receivedQuantity || 0),
      0
    );
    const totalOrdered = procurement.products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    const receivedMessage = `Received ${totalReceived} out of ${totalOrdered} items so far`;

    // בדיקה אם כבר קיימת הודעה על הכמות שהתקבלה
    let updatedNotes = procurement.notes || "";
    const receivedMessageRegex = /Received \d+ out of \d+ items so far/;
    if (receivedMessageRegex.test(updatedNotes)) {
      // עדכון ההודעה הקיימת
      updatedNotes = updatedNotes.replace(
        receivedMessageRegex,
        receivedMessage
      );
    } else {
      // הוספת ההודעה אם היא לא קיימת
      updatedNotes = updatedNotes
        ? `${updatedNotes} | ${receivedMessage}`
        : receivedMessage;
    }

    // שרשור הערות נוספות אם קיימות
    if (additionalNotes) {
      updatedNotes = updatedNotes
        ? `${updatedNotes} | ${additionalNotes}`
        : additionalNotes;
    }

    // עדכון ה-notes במסמך
    procurement.notes = updatedNotes;

    // עדכון דירוג הספק: בדיקה והמרה למערך אם צריך
    if (supplierRating && supplierRating >= 1 && supplierRating <= 5) {
      console.log(`📊 Updating supplier rating for ${supplier.SupplierName}`);
      console.log(`📌 Current Rating array:`, supplier.Rating);
      console.log(`⭐ New rating:`, supplierRating);
      
      // ודא שהשדה Rating קיים ומערך
      if (!supplier.Rating) {
        supplier.Rating = [];
      } else if (!Array.isArray(supplier.Rating)) {
        supplier.Rating = [supplier.Rating];
      }
      
      // הוסף את הדירוג החדש
      supplier.Rating.push(Number(supplierRating));
      
      // חישוב ממוצע הדירוגים
      const totalRatings = supplier.Rating.reduce((sum, rating) => sum + Number(rating), 0);
      const averageRating = totalRatings / supplier.Rating.length;
      supplier.averageRating = Math.round(averageRating * 10) / 10; // עיגול לספרה אחת אחרי הנקודה
      
      console.log(`📈 New average rating: ${supplier.averageRating} (from ${supplier.Rating.length} ratings)`);
      
      try {
      const savedSupplier = await supplier.save();
      console.log(`✅ Supplier saved successfully. Average rating: ${savedSupplier.averageRating}`);
      } catch (supplierSaveError) {
        console.error("⚠️ Error saving supplier rating:", supplierSaveError);
        console.error("Supplier save error details:", {
          message: supplierSaveError.message,
          name: supplierSaveError.name,
          errors: supplierSaveError.errors,
        });
        // לא נכשיל את הפעולה אם שמירת הדירוג נכשלה
      }
    } else if (supplierRating !== undefined && supplierRating !== 0) {
      console.log(`⚠️ Invalid rating received: ${supplierRating}`);
      return res.status(400).json({
        success: false,
        message: "Supplier rating must be between 1 and 5.",
      });
    } else {
      console.log(`ℹ️ No rating provided or rating is 0`);
    }

    // לוגיקה לעדכון סטטוס והודעות
    if (hasDiscrepancy && allowCloseWithDiscrepancy === false) {
      procurement.orderStatus = "In Progress";
      procurement.receivedDate = new Date();
      const discrepancyDetails = procurement.products
        .filter((product) => product.receivedQuantity !== product.quantity)
        .map(
          (product) =>
            `Product "${product.productName}" - Ordered: ${product.quantity}, Received: ${product.receivedQuantity}`
        )
        .join("; ");

      procurement.notes = procurement.notes
        ? `${procurement.notes} | The purchase order was closed with quantity differences: ${discrepancyDetails}`
        : `The purchase order was closed with quantity differences: ${discrepancyDetails}`;

      const allProductsReceived = procurement.products.every(
        (product) => product.receivedQuantity === product.quantity
      );

      if (allProductsReceived) {
        procurement.orderStatus = "Delivered";
        procurement.notes +=
          " | All missing quantities have now been received. Order closed.";
      } else {
        const discrepanciesArray = procurement.products
          .filter((product) => product.receivedQuantity !== product.quantity)
          .map((product) => ({
            productName: product.productName,
            orderedQuantity: product.quantity,
            receivedQuantity: product.receivedQuantity,
          }));

        try {
        await sendProcurementDiscrepancyEmail(
          supplier.Email,
          supplier.SupplierName,
          company.name,
          procurement.PurchaseOrder,
          discrepanciesArray
        );
          console.log("✅ Discrepancy email sent successfully");
        } catch (emailError) {
          console.error("⚠️ Error sending discrepancy email:", emailError);
          // לא נכשיל את הפעולה אם האימייל נכשל
        }
      }
    } else if (hasDiscrepancy && allowCloseWithDiscrepancy) {
      procurement.orderStatus = "Delivered";
      procurement.receivedDate = new Date();
      const discrepancyDetails = procurement.products
        .filter((product) => product.receivedQuantity !== product.quantity)
        .map(
          (product) =>
            `Product "${product.productName}" - Ordered: ${product.quantity}, Received: ${product.receivedQuantity}`
        )
        .join("; ");

      procurement.notes = procurement.notes
        ? `${procurement.notes} | The purchase order was closed with quantity differences: ${discrepancyDetails}`
        : `The purchase order was closed with quantity differences: ${discrepancyDetails}`;

      const discrepanciesArray = procurement.products
        .filter((product) => product.receivedQuantity !== product.quantity)
        .map((product) => ({
          productName: product.productName,
          orderedQuantity: product.quantity,
          receivedQuantity: product.receivedQuantity,
        }));

      try {
      await sendProcurementDiscrepancyEmail(
        supplier.Email,
        supplier.SupplierName,
        company.name,
        procurement.PurchaseOrder,
        discrepanciesArray
      );
        console.log("✅ Discrepancy email sent successfully");
      } catch (emailError) {
        console.error("⚠️ Error sending discrepancy email:", emailError);
        // לא נכשיל את הפעולה אם האימייל נכשל
      }
    } else {
      procurement.orderStatus = "Delivered";
      procurement.receivedDate = new Date();
    }

    console.log("💾 Saving procurement...");
    try {
    await procurement.save();
      console.log("✅ Procurement saved successfully");
    } catch (procurementSaveError) {
      console.error("❌ Error saving procurement:", procurementSaveError);
      console.error("Procurement save error details:", {
        message: procurementSaveError.message,
        name: procurementSaveError.name,
        errors: procurementSaveError.errors,
      });
      throw new Error(`Failed to save procurement: ${procurementSaveError.message}`);
    }

    res.json({
      success: true,
      message: "Received quantities updated successfully!",
    });
  } catch (err) {
    console.error("❌ Error in receivedOrder:", err);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      message: err.message,
      name: err.name,
      errors: err.errors,
    });
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};
