import Suppliers from "../models/suppliers.model.js";
import Notification from "../models/notification.model.js";
import Procurement from "../models/procurement.model.js";
import Employee from "../models/employees.model.js";
import Company from "../models/companies.model.js";
import UpdateProcurement from "../models/UpdateProcurement.model.js";
import jwt from "jsonwebtoken";
// Create a new supplier
import {
  uploadToCloudinary,
  extractPublicId,
} from "../config/lib/cloudinary.js";

export const createSupplier = async (req, res) => {
  try {
    // בדיקת טוקן ואימות
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || !decodedToken.companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const companyId = decodedToken.companyId;

    // קריאת שדות מהגוף
    const {
      SupplierName,
      Contact,
      Phone,
      Email,
      Address,
      BankAccount,
      Rating,
      baseCurrency,
      IsActive,
      ProductsSupplied,
      ConfirmationAccount, // אפשר לקבל גם ערך מטופס (אם לא הועלה קובץ)
    } = req.body;
    console.log(req.body);
    console.log(req.files);

    // בדיקת ולידציה לשדות נדרשים
    if (!SupplierName) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required.",
      });
    }

    // טיפול בהעלאת קבצים - attachments
    let attachmentsArray = [];
    if (req.files && req.files.attachments) {
      for (const file of req.files.attachments) {
        // uploadToCloudinary תקבל את ה-buffer (המגיע מ־multer memoryStorage)
        const uploadResult = await uploadToCloudinary(file.buffer, {
          folder: "suppliers/attachments",
          use_filename: true,
          unique_filename: false,
        });
        attachmentsArray.push({
          fileName: file.originalname,
          fileUrl: uploadResult.secure_url,
          // uploadedAt יוגדר כברירת מחדל במודל
        });
      }
    }

    // טיפול בהעלאת קובץ עבור ConfirmationAccount (אם קיים)
    let confirmationAccountURL = "";
    if (
      req.files &&
      req.files.confirmationAccount &&
      req.files.confirmationAccount.length > 0
    ) {
      const file = req.files.confirmationAccount[0];
      const uploadResult = await uploadToCloudinary(file.buffer, {
        folder: "suppliers/confirmationAccounts",
        use_filename: true,
        unique_filename: false,
      });
      confirmationAccountURL = uploadResult.secure_url;
    }

    // יצירת ספק חדש עם כל השדות, כולל קבצים שהועלו
    const newSupplier = new Suppliers({
      companyId,
      SupplierName,
      Contact,
      Phone,
      Email,
      Address,
      BankAccount,
      Rating,
      baseCurrency,
      IsActive,
      // אם הועלה קובץ עבור ConfirmationAccount, נעדכן אותו; אחרת, נשתמש בערך מהגוף
      ConfirmationAccount: confirmationAccountURL || ConfirmationAccount,
      ProductsSupplied,
      attachments: attachmentsArray,
    });

    const savedSupplier = await newSupplier.save();

    res.status(201).json({ success: true, data: savedSupplier });
  } catch (error) {
    console.error("Error creating supplier:", error.message);
    res.status(500).json({
      success: false,
      message: "Error creating supplier",
      error: error.message,
    });
  }
};

export const getAllSuppliers = async (req, res) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }
    const suppliers = await Suppliers.find({ companyId });

    if (suppliers.length > 0) {
      return res.status(200).json({ success: true, data: suppliers });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "No suppliers found" });
    }
  } catch (error) {
    console.error("Error retrieving suppliers:", error); // לוג לשגיאות
    return res.status(500).json({
      success: false,
      message: "Error retrieving suppliers",
      error: error.message,
    });
  }
};
export const addProductToSupplier = async (req, res) => {
  const { supplierId } = req.params;
  const { productId, productName } = req.body;

  try {
    const supplier = await Suppliers.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    supplier.ProductsSupplied.push({ productId, productName });
    await supplier.save();

    res
      .status(200)
      .json({ success: true, message: "Product added successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};

// Pull supplier by id
export const getSupplierById = async (req, res) => {
  try {
    console.log("Fetching supplier with ID:", req.params.id);
    const supplier = await Suppliers.findById(req.params.id);
    if (!supplier) {
      console.log("Supplier not found.");
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    console.error("Error retrieving supplier:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving supplier",
      error: error.message,
    });
  }
};

// Update supplier by allowed fields
export const updateSupplier = async (req, res) => {
  // סינון השדות מהגוף (body)
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(
      ([key, value]) => value !== "" && value !== undefined
    )
  );

  const allowedUpdates = [
    "SupplierName",
    "Contact",
    "Phone",
    "Email",
    "Address",
    "BankAccount",
    "Rating",
    "IsActive",
    "ProductsSupplied",
  ];

  // בדיקה שכל המפתחות שמתקבלים הם מותרת
  const isValidUpdate = Object.keys(updates).every((key) =>
    allowedUpdates.includes(key)
  );
  if (!isValidUpdate) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid update fields." });
  }

  try {
    // טיפול בהעלאת קבצים, אם קיימים
    if (req.files && req.files.attachments && req.files.attachments.length > 0) {
      let newAttachments = [];
      for (const file of req.files.attachments) {
        const uploadResult = await uploadToCloudinary(file.buffer, {
          folder: "suppliers/attachments",
          use_filename: true,
          unique_filename: false,
        });
        newAttachments.push({
          fileName: file.originalname,
          fileUrl: uploadResult.secure_url,
          uploadedAt: new Date(),
        });
      }
      // אם רוצים למזג את הקבצים החדשים עם הקיימים, אפשר לשלוף את המסמך הקיים ולהוסיף אליו.
      // כאן אנו פשוט מעדכנים את השדה attachments עם הקבצים החדשים:
      updates.attachments = newAttachments;
    }

    const updatedSupplier = await Suppliers.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    res.status(200).json({ success: true, data: updatedSupplier });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating supplier",
      error: error.message,
    });
  }
};
// Delete supplier by id
export const deleteSupplier = async (req, res) => {
  try {
    const deletedSupplier = await Suppliers.findByIdAndDelete(req.params.id);
    if (!deletedSupplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting supplier",
      error: error.message,
    });
  }
};

export const searchSuppliers = async (req, res) => {
  const { name, rating, isActive, country } = req.query;

  const filter = {};
  if (name) filter.SupplierName = { $regex: name, $options: "i" };
  if (rating) filter.Rating = { $gte: parseFloat(rating) };
  if (isActive !== undefined) filter.IsActive = isActive === "true";
  if (country) filter["Address.country"] = { $regex: country, $options: "i" };

  try {
    const suppliers = await Suppliers.find(filter);
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching suppliers",
      error: error.message,
    });
  }
};

export const approveUpdateProcurement = async (req, res) => {
  const { updates } = req.body;
  const { PurchaseOrder } = req.params;

  try {
    const allowedUpdates = [
      "status",
      "deliveryDate",
      "quantity",
      "products",
      "totalCost",
      "statusUpdate",
      "currency",
    ];
    // 1. Validate that all keys in `updates` are allowed.
    const isValidUpdate = Object.keys(updates).every((key) =>
      allowedUpdates.includes(key)
    );

    if (!isValidUpdate) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid update fields." });
    }

    const updatedProcurement = await Procurement.findOneAndUpdate(
      { PurchaseOrder },
      updates,
      { new: true, runValidators: true }
    );
    console.log("Updated Procurement:", updatedProcurement);

    if (!updatedProcurement) {
      return res
        .status(404)
        .json({ success: false, message: "Procurement not found" });
    }

    const findAdmins = await Employee.find({
      companyId: updatedProcurement.companyId,
      role: "Admin",
    });
    console.log("Admins:", findAdmins);

    if (findAdmins.length > 0) {
      await Promise.all(
        findAdmins.map((admin) =>
          Notification.create({
            companyId: updatedProcurement.companyId,
            content:
              "Update successfully approved for order no. " + PurchaseOrder,
            type: "Info",
            employeeId: admin._id, // _id ולא employeeId
            PurchaseOrder: PurchaseOrder,
            isRead: false,
          })
        )
      );
    }

    const updatedProcurementDelete = await UpdateProcurement.deleteOne({
      "updatedData.PurchaseOrder": PurchaseOrder,
    });

    return res.status(200).json({
      success: true,
      message: "Updates approved successfully",
      data: updatedProcurement,
    });
  } catch (error) {
    console.error("Error approving updates for Procurement:", error);
    return res.status(500).json({
      success: false,
      message: "Error approving updates for Procurement",
      error: error.message,
    });
  }
};

export const rejectUpdateProcurement = async (req, res) => {
  const { PurchaseOrder } = req.params;

  try {
    // Attempt to find and delete the pending update for the given PurchaseOrder
    const deletedUpdate = await UpdateProcurement.findOneAndDelete({
      "updatedData.PurchaseOrder": PurchaseOrder,
    });

    // If no such update exists, respond accordingly
    if (!deletedUpdate) {
      return res.status(404).json({
        success: false,
        message: "No pending update found for the provided Purchase Order.",
      });
    }

    // Retrieve the companyId from the deleted update data
    const { companyId } = deletedUpdate.updatedData;

    // Find all Admin employees related to the company
    const findAdmins = await Employee.find({
      companyId,
      role: "Admin",
    });

    // Create notifications for each Admin about the rejection
    if (findAdmins.length > 0) {
      await Promise.all(
        findAdmins.map((admin) =>
          Notification.create({
            companyId,
            content:
              "Update request for order no. " +
              PurchaseOrder +
              " has been rejected.",
            type: "Warning", // You can adjust the notification type as needed
            employeeId: admin._id,
            PurchaseOrder: PurchaseOrder,
            isRead: false,
          })
        )
      );
    }

    // Successfully deleted the update request
    return res.status(200).json({
      success: true,
      message: "Update rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting update for Procurement:", error);
    return res.status(500).json({
      success: false,
      message: "Error rejecting update for Procurement",
      error: error.message,
    });
  }
};
