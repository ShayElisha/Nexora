import Budget from "../models/Budget.model.js";
import Product from "../models/product.model.js";
import Notification from "../models/notification.model.js";
import jwt from "jsonwebtoken";
import cloudinary, {
  uploadToCloudinaryFile,
} from "../config/lib/cloudinary.js";
import mongoose from "mongoose";

export const getBudgets = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication token is missing." });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid authentication token." });
    }

    const companyId = decodedToken.companyId;

    const budgets = await Budget.find({ companyId });
    console.log("budgets => ", budgets);

    return res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

export const createBudget = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token)
      return res
        .status(401)
        .json({ error: "Authentication token is missing." });

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid authentication token." });
    }

    const budgetData = req.body;
    const createdBy = decodedToken.employeeId;
    const companyId = decodedToken.companyId;

    if (!companyId)
      return res.status(400).json({ error: "companyId is required." });
    if (
      !budgetData.departmentOrProjectName ||
      typeof budgetData.departmentOrProjectName !== "string"
    ) {
      return res.status(400).json({
        error: "Department or Project Name is required and must be a string.",
      });
    }
    const amount = parseFloat(budgetData.amount);
    if (isNaN(amount)) {
      return res.status(400).json({ error: "Amount must be a valid number." });
    }

    if (budgetData.startDate && isNaN(Date.parse(budgetData.startDate))) {
      return res
        .status(400)
        .json({ error: "Start Date must be a valid date." });
    }
    if (budgetData.endDate && isNaN(Date.parse(budgetData.endDate))) {
      return res.status(400).json({ error: "End Date must be a valid date." });
    }
    if (budgetData.categories) {
      if (!Array.isArray(budgetData.categories)) {
        return res.status(400).json({ error: "Categories must be an array." });
      }
      for (const category of budgetData.categories) {
        if (!category.name || typeof category.name !== "string") {
          return res
            .status(400)
            .json({ error: "Each category must have a valid name." });
        }
        if (
          typeof category.allocatedAmount !== "number" ||
          isNaN(category.allocatedAmount)
        ) {
          return res.status(400).json({
            error: "Each category must have a valid allocatedAmount.",
          });
        }
      }
    }

    const newBudgetData = {
      ...budgetData,
      companyId,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newBudget = new Budget(newBudgetData);
    await newBudget.save();
    res.status(201).json({ data: newBudget });
  } catch (err) {
    console.error("Error creating budget:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * קבלת פרטי תקציב לפי מזהה, תוך התחשבות ב-companyId אם נדרש.
 */
export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, message: "Budget not found" });
    }
    res.json({ success: true, data: budget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Budget.controller.js
export const updateBudget = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decodedToken.employeeId;
    const budgetId = req.params.id;
    const itemsToAdd = req.body.items; // נניח שב-Frontend שולחים { items: [...] }

    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid budget ID format." });
    }

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, message: `Budget not found: ${budgetId}` });
    }

    // חישוב סכום ההוצאה
    const totalSpent = (itemsToAdd || []).reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // הוספת הפריטים למערך items
    budget.items.push(...itemsToAdd);

    // עדכון הסכום שנוצל
    budget.spentAmount += totalSpent;
    budget.updatedAt = new Date();

    await budget.save();
    if (!employeeId) {
      console.error(
        "Error: employeeId is missing, notification will not be sent."
      );
    }
    if (budget.spentAmount > budget.amount) {
      console.log(
        `Budget exceeded for: ${budget.departmentOrProjectName}, sending notification...`
      );

      const notification = new Notification({
        companyId: budget.companyId,
        content: `The budget ${budget.departmentOrProjectName} has been exceeded.`,
        type: "Error",
        employeeId: employeeId,
      });

      await notification.save();
      console.log("Notification saved successfully.");
    }

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Error updating budget:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating budget",
    });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const deletedBudget = await Budget.findByIdAndDelete(req.params.id);
    if (!deletedBudget)
      return res.status(404).json({ error: "Budget not found" });
    res.json({ message: "Budget deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findById(id);
    if (!budget) return res.status(404).json({ error: "Budget not found" });

    // פונקציה לעיצוב תאריך כחודש ושנה (למשל "Jan 2025")
    const formatMonthYear = (date) =>
      date.toLocaleString("en-US", { year: "numeric", month: "short" });

    // קיבוץ פריטי התקציב לפי חודש ושנה באמצעות reduce
    const itemsByMonth = (budget.items || []).reduce((acc, item) => {
      if (item.addedAt) {
        const month = formatMonthYear(new Date(item.addedAt));
        acc[month] = (acc[month] || 0) + item.totalPrice;
      }
      return acc;
    }, {});

    let periods = [];
    let budgetValues = [];
    let actualValues = [];

    if (budget.startDate && budget.endDate) {
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);
      // חישוב מספר החודשים בין שני התאריכים כולל
      const totalMonths =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;

      for (let i = 0; i < totalMonths; i++) {
        // קביעת התאריך של כל חודש בתקופה
        const current = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const monthKey = formatMonthYear(current);
        periods.push(monthKey);
        budgetValues.push(budget.amount);
        actualValues.push(itemsByMonth[monthKey] || 0);
      }
    } else {
      // במקרה ואין תאריכי התחלה וסיום, משתמשים ישירות בחודשים שמצויים בפריטים
      periods = Object.keys(itemsByMonth);
      const equalBudget = budget.amount / (periods.length || 1);
      budgetValues = periods.map(() => equalBudget);
      actualValues = periods.map((month) => itemsByMonth[month] || 0);
    }

    const responseData = {
      departmentOrProjectName: budget.departmentOrProjectName,
      amount: budget.amount,
      period: budget.period,
      performance: {
        periods,
        budgetValues,
        actualValues,
      },
    };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBudgetsByProject = async (req, res) => {
  try {
    const { companyId, projectId } = req.query;
    if (!companyId || !projectId) {
      return res
        .status(400)
        .json({ error: "companyId and projectId parameters are required" });
    }

    const budgets = await Budget.find({ companyId, projectId }).populate(
      "departmentId createdBy updatedBy approvals.approvedBy"
    );
    res.json({ data: budgets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBudgetsByDepartment = async (req, res) => {
  try {
    const { companyId, departmentId } = req.query;
    if (!companyId || !departmentId) {
      return res
        .status(400)
        .json({ error: "companyId and departmentId parameters are required" });
    }

    const budgets = await Budget.find({ companyId, departmentId }).populate(
      "projectId createdBy updatedBy approvals.approvedBy"
    );
    res.json({ data: budgets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rejectedBy } = req.body;

    const budget = await Budget.findById(id);
    if (!budget) return res.status(404).json({ error: "Budget not found" });

    budget.status = "Rejected";
    budget.approvals.push({
      approvedBy: rejectedBy || req.user._id,
      approvedAt: new Date(),
      comment: comment || "Budget rejected",
    });

    budget.updatedAt = Date.now();
    await budget.save();

    res.json({ data: budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * אישור תקציב - מעדכן את הסטטוס ל-Approved ומוסיף רשומה לאישורים.
 * דורש שדרכם יינתן comment אופציונלי.
 */
export const approveBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, approvedBy } = req.body; // approvedBy יכול להיות מזהה המשתמש המאשר או להשתמש ב-req.user

    const budget = await Budget.findById(id);
    if (!budget) return res.status(404).json({ error: "Budget not found" });

    budget.status = "Approved";
    budget.approvals.push({
      approvedBy: approvedBy || req.user._id,
      approvedAt: new Date(),
      comment: comment || "",
    });

    budget.updatedAt = Date.now();
    await budget.save();

    res.json({ data: budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * הוספת קטגוריה חדשה לתקציב קיים.
 * דורש את מזהה התקציב ב-params ואת פרטי הקטגוריה ב-body.
 */
export const addCategoryToBudget = async (req, res) => {
  try {
    const { id } = req.params; // מזהה התקציב
    const { name, allocatedAmount } = req.body;

    const budget = await Budget.findById(id);
    if (!budget) return res.status(404).json({ error: "Budget not found" });

    budget.categories.push({ name, allocatedAmount });
    budget.updatedAt = Date.now();
    await budget.save();

    res.json({ data: budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * עדכון סכום הקצאה עבור קטגוריה קיימת בתקציב.
 * דורש את מזהה התקציב ב-params ושם הקטגוריה ואת הסכום החדש ב-body.
 */
export const updateCategoryAllocation = async (req, res) => {
  try {
    const { id } = req.params; // מזהה התקציב
    const { categoryName, allocatedAmount } = req.body;

    const budget = await Budget.findById(id);
    if (!budget) return res.status(404).json({ error: "Budget not found" });

    const category = budget.categories.find((cat) => cat.name === categoryName);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    category.allocatedAmount = allocatedAmount;
    budget.updatedAt = Date.now();
    await budget.save();

    res.json({ data: budget });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const signBudget = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;
  const { employeeId, signature } = req.body; // Employee trying to sign

  try {
    // Find the budget document
    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    // Upload the signature to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(signature, {
      folder: "budget_signatures",
      public_id: `budget_signature_${id}_${employeeId}`,
    });

    // Sort signers by their order to ensure signing sequence
    budget.signers.sort((a, b) => a.order - b.order);

    // Check if the signer is authorized for this budget
    const signerInList = budget.signers.find(
      (signer) => signer.employeeId?.toString() === employeeId
    );
    if (!signerInList) {
      return res.status(400).json({
        success: false,
        message: "You are not authorized to sign this budget.",
      });
    }

    // Check if the signer has already signed
    if (signerInList.hasSigned) {
      return res.status(400).json({
        success: false,
        message: "You have already signed this budget.",
      });
    }

    // Ensure the correct order of signing
    const nextSigner = budget.signers.find(
      (signer) => signer.order === budget.currentSignerIndex
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

    // Find the index of the current signer in the array
    const signerIndex = budget.signers.findIndex(
      (signer) => signer.employeeId?.toString() === employeeId
    );

    if (signerIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Signer not found in the list.",
      });
    }

    // Update the signer's record with the signature URL and timestamp
    budget.signers[signerIndex].signatureUrl = uploadResponse.secure_url;
    budget.signers[signerIndex].hasSigned = true;
    budget.signers[signerIndex].timeStamp = new Date();

    // Increment signature count and move to the next signer
    budget.currentSignatures += 1;
    budget.currentSignerIndex = budget.currentSignatures;

    // If all required signatures are collected, update budget status
    if (budget.currentSignatures === budget.signers.length) {
      budget.status = "Approved";
    }

    // Save the updated budget document
    await budget.save();
    return res.status(200).json({
      success: true,
      data: budget,
      signatureUrl: uploadResponse.secure_url,
    });
  } catch (error) {
    console.error("Error signing budget:", error);
    res.status(500).json({
      success: false,
      message: "Error signing budget",
    });
  }
};

export const assignToBudget = async (req, res) => {
  const { productId, quantity, budgetId } = req.body;

  // בדיקת שדות חובה
  if (!productId || !quantity || !budgetId) {
    return res
      .status(400)
      .json({ message: "productId, quantity, and budgetId are required." });
  }

  // התחלת סשן לטרנזקציה
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // מציאת המוצר
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error("Product not found.");
    }

    // בדיקת מלאי
    if (product.stock < quantity) {
      throw new Error("Insufficient stock.");
    }

    // מציאת התקציב
    const budget = await Budget.findById(budgetId).session(session);
    if (!budget) {
      throw new Error("Budget not found.");
    }

    // עדכון מלאי המוצר
    product.stock -= quantity;
    await product.save({ session });

    budget.items.push({
      product: productId,
      quantity,
      unitPrice: product.price, // הנח שיש שדה price במוצר
      totalPrice: product.price * quantity,
    });

    // עדכון הסכום שהוצא
    budget.spentAmount += product.price * quantity;

    await budget.save({ session });

    // אישור הטרנזקציה
    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({ message: "Products assigned to budget successfully." });
  } catch (error) {
    // ביטול הטרנזקציה במקרה של שגיאה
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};
