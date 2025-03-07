import Procurement from "../models/procurement.model.js";
import Supplier from "../models/suppliers.model.js";
import Company from "../models/companies.model.js";
import Product from "../models/product.model.js";
import Inventory from "../models/inventory.model.js";
import {
  sendProcurementEmailWithPDF,
  sendProcurementDiscrepancyEmail,
} from "../emails/emailService.js";

import jwt from "jsonwebtoken";
import cloudinary, {
  extractPublicId,
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

  const pro = await Procurement.findById(procurementId);
  if (pro.summeryProcurement) {
    const publicId = extractPublicId(pro.summeryProcurement);
    if (publicId) {
      // חשוב לא להשתמש שוב בשם "res", מכיוון שזה קונפליקט עם response
      const deletionResult = await cloudinary.uploader.destroy(publicId);
      console.log("Deletion result:", deletionResult);
    } else {
      console.log("Could not extract public_id from URL");
    }
  }

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
export const receivedOrder = async (req, res) => {
  const { id } = req.params;
  const {
    receivedQuantities,
    allowCloseWithDiscrepancy,
    additionalNotes,
    supplierRating,
  } = req.body;

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

  try {
    const procurement = await Procurement.findOne({
      _id: id,
      companyId,
    }).populate("products.productId");
    if (!procurement) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement not found" });
    }

    let hasDiscrepancy = false;

    for (const product of procurement.products) {
      if (!product.productId) {
        return res.status(400).json({
          success: false,
          message: `ProductId not found for product ${product.productName}`,
        });
      }

      const productIdStr = product.productId._id.toString();
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

      const productDoc = await Product.findById(product.productId._id);
      if (!productDoc) {
        return res.status(400).json({
          success: false,
          message: `Product with id "${product.productId._id}" not found.`,
        });
      }

      let inventory = await Inventory.findOne({
        companyId: companyId,
        productId: product.productId._id,
      });

      if (!inventory) {
        inventory = new Inventory({
          companyId: companyId,
          productId: product.productId._id,
          quantity: receivedQty,
        });
      } else {
        inventory.quantity += receivedQty;
      }

      await inventory.save();
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
    if (supplierRating >= 1 && supplierRating <= 5) {
      if (!Array.isArray(supplier.Rating)) {
        supplier.Rating =
          supplier.Rating !== undefined && supplier.Rating !== null
            ? [supplier.Rating]
            : [];
      }
      supplier.Rating.push(supplierRating);
      await supplier.save();
    } else if (supplierRating !== undefined && supplierRating !== 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier rating must be between 1 and 5.",
      });
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

        await sendProcurementDiscrepancyEmail(
          supplier.Email,
          supplier.SupplierName,
          company.name,
          procurement.PurchaseOrder,
          discrepanciesArray
        );
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

      await sendProcurementDiscrepancyEmail(
        supplier.Email,
        supplier.SupplierName,
        company.name,
        procurement.PurchaseOrder,
        discrepanciesArray
      );
    } else {
      procurement.orderStatus = "Delivered";
      procurement.receivedDate = new Date();
    }

    await procurement.save();

    res.json({
      success: true,
      message: "Received quantities updated successfully!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
