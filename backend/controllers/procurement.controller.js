import Procurement from "../models/procurement.model.js";
import Supplier from "../models/suppliers.model.js";
import Company from "../models/companies.model.js";
import { sendProcurementEmailWithPDF } from "../emails/emailService.js";

import jwt from "jsonwebtoken";
import cloudinary, {
  uploadToCloudinaryFile,
} from "../config/lib/cloudinary.js";

// Create a new procurement
export const createProcurementRecord = async (req, res) => {
  const companyId = req.user.companyId;

  const {
    PurchaseOrder,
    supplierId,
    supplierName,
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
  } = req.body;

  console.log("Received procurement data:", req.body);

  if (
    !PurchaseOrder ||
    !companyId ||
    !supplierId ||
    !PaymentMethod ||
    !PaymentTerms ||
    !products ||
    products.length === 0 ||
    !DeliveryAddress ||
    !totalCost ||
    !summeryProcurement
  ) {
    return res.status(400).json({
      success: false,
      message:
        "All required fields must be provided, including products and supplier details.",
    });
  }

  try {
    // Validate products
    const validatedProducts = products.map((product) => {
      const { productName, SKU, category, unitPrice, quantity } = product;

      if (!productName || !SKU || !category || !unitPrice || !quantity) {
        throw new Error(
          "Each product must include productName, SKU, category, unitPrice, and quantity."
        );
      }

      return {
        ...product,
        unitPrice: parseFloat(unitPrice),
        quantity: parseInt(quantity, 10),
        total: parseFloat(unitPrice) * parseInt(quantity, 10),
      };
    });

    // Upload PDF
    let summeryProcurementUrl = "";
    try {
      const uploadResult = await uploadToCloudinaryFile(summeryProcurement);
      summeryProcurementUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error("Error uploading summary:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload PDF summary.",
      });
    }

    // Save procurement record
    const newProcurementRecord = new Procurement({
      companyId,
      PurchaseOrder,
      supplierId,
      supplierName,
      products: validatedProducts,
      PaymentMethod,
      PaymentTerms,
      DeliveryAddress,
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
      totalCost: parseFloat(totalCost),
      summeryProcurement: summeryProcurementUrl,
      currentSignatures: currentSignatures || 0,
      currentSignerIndex: currentSignerIndex || 0,
      signers: Array.isArray(signers) ? signers : [],
      status: status || "pending",
      statusUpdate: statusUpdate || null,
    });

    const savedProcurementRecord = await newProcurementRecord.save();

    res.status(201).json({ success: true, data: savedProcurementRecord });
  } catch (error) {
    console.error("Error creating procurement record:", error);
    res.status(500).json({
      success: false,
      message: "Error creating procurement record",
      error: error.message,
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
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { employeeId, signature } = req.body; // המשתמש שמנסה לחתום

  try {
    const procurement = await Procurement.findById(id);
    if (!procurement) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement not found" });
    }
    const uploadResponse = await cloudinary.uploader.upload(signature, {
      folder: "signatures",
      public_id: `signature_${id}_${employeeId}`,
    });

    procurement.signers.sort((a, b) => a.order - b.order);

    const signerInList = procurement.signers.find(
      (signer) => signer.employeeId?.toString() === employeeId
    );
    if (!signerInList) {
      return res.status(400).json({
        success: false,
        message: "You are not in the signers list for this procurement.",
      });
    }

    if (signerInList.hasSigned) {
      return res.status(400).json({
        success: false,
        message: "You have already signed this procurement.",
      });
    }

    const nextSigner = procurement.signers.find(
      (signer) => signer.order === procurement.currentSignerIndex
    );

    if (!nextSigner) {
      return res.status(400).json({
        success: false,
        message: "No next signer found or invalid order state.",
      });
    }

    if (nextSigner.employeeId?.toString() !== employeeId) {
      return res.status(400).json({
        success: false,
        message: "It is not your turn to sign yet. Please wait for your turn.",
      });
    }
    const signerIndex = procurement.signers.findIndex(
      (signer) => signer.employeeId?.toString() === employeeId
    );

    if (signerIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Signer not found in the list.",
      });
    }
    procurement.signers[signerIndex].signatureUrl = uploadResponse.secure_url;

    signerInList.hasSigned = true;
    signerInList.timeStamp = new Date();

    procurement.currentSignatures += 1;
    procurement.currentSignerIndex = procurement.currentSignatures;

    if (procurement.currentSignatures === procurement.signers.length) {
      procurement.status = "completed";
      procurement.approvalStatus = "Approved";
      const supplierDetails = await Supplier.findById(procurement.supplierId);
      const companyDetails = await Company.findById(companyId);

      if (!supplierDetails || !supplierDetails.Email) {
        console.error("Supplier details or email not found:", supplierDetails);
        throw new Error("Supplier email is missing.");
      }
      if (!companyDetails || !companyDetails.name) {
        console.error("Company details or name not found:", companyDetails);
        throw new Error("Company name is missing.");
      }
      if (!procurement.summeryProcurement) {
        console.error(
          "Summery procurement data is missing:",
          summeryProcurement,
          summeryProcurementUrl
        );
        throw new Error("PDF data or URL is missing.");
      }

      // Convert PDF Base64 to Buffer
      const pdfBuffer = Buffer.from(procurement.summeryProcurement, "base64");

      try {
        await sendProcurementEmailWithPDF(
          supplierDetails.Email,
          supplierDetails.SupplierName,
          companyDetails.name,
          procurement.summeryProcurement,
          pdfBuffer
        );
        console.log("Procurement email sent successfully.");
      } catch (emailError) {
        console.error("Error sending procurement email:", emailError.message);
        console.error("Error details:", emailError);
      }
    }

    await procurement.save();
    return res.status(200).json({
      success: true,
      data: procurement,
      signatureUrl: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error("Error signing procurement:", error);
    res
      .status(500)
      .json({ success: false, message: "Error signing procurement" });
  }
};
export const getAllSignatures = async (req, res) => {
  try {
    const documents = await Procurement.find();

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
// Get signatures for a specific employee
export const getEmployeeSignatures = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const employeeId = decodedToken?.employeeId;

  try {
    // חיפוש רשומות עם חתימות של העובד
    const procurements = await Procurement.find({
      signers: {
        $elemMatch: {
          employeeId: employeeId,
          hasSigned: true,
        },
      },
    });

    if (!procurements || procurements.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No signatures found for this employee.",
      });
    }

    // יצירת מבנה נתונים מותאם לתשובה
    const employeeSignatures = procurements.map((procurement) => {
      const signer = procurement.signers.find(
        (s) => s.employeeId.toString() === employeeId
      );

      return {
        purchaseOrder: procurement.PurchaseOrder,
        supplierName: procurement.supplierName,
        documentUrl: procurement.summeryProcurement,
        signatureUrl: signer?.signatureUrl || null,
        signedAt: signer?.timeStamp || null,
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
    "products", // מערך מוצרים
    "PaymentMethod",
    "PaymentTerms",
    "DeliveryAddress",
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
  ];

  let summeryProcurementUrl = "";

  // אם ה-PDF נשלח, העלה אותו ל-Cloudinary
  if (updates.summeryProcurement) {
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
      } else if (key !== "summeryProcurement") {
        obj[key] = updates[key];
      }
      return obj;
    }, {});

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
