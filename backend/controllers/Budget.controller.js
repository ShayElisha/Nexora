import Budget from "../models/Budget.model.js";
import Product from "../models/product.model.js";
import Notification from "../models/notification.model.js";
import Department from "../models/department.model.js";
import Signature from "../models/signature.model.js";
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

    const budgets = await Budget.find({ companyId })
      .populate("departmentId", "name")
      .populate("items.productId", "productName")
      .populate("signers.employeeId", "name lastName email");

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

    console.log(budgetData);
    console.log(companyId);

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

    // המרת סכום למספר ועדכון הנתון
    const amount = parseFloat(budgetData.amount);
    if (isNaN(amount)) {
      return res.status(400).json({ error: "Amount must be a valid number." });
    }
    budgetData.amount = amount;

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

    // בדיקה: האם קיים תקציב פעיל למחלקה זו
    const activeBudget = await Budget.findOne({
      companyId,
      departmentOrProjectName: budgetData.departmentOrProjectName,
      endDate: { $gt: new Date() },
    });

    if (activeBudget) {
      const now = new Date();
      const activeEndDate = new Date(activeBudget.endDate);
      const diffMs = activeEndDate - now;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // אם יש תקציב קיים והפרש הסיום גדול מ-3 ימים, לא ניתן ליצור תקציב חדש
      if (diffDays > 3) {
        return res.status(400).json({
          error:
            "תקציב קיים למחלקה זו עדיין לא הסתיים. ניתן ליצור תקציב חדש רק כשנשארו 3 ימים או פחות לסיום התקציב הקיים.",
        });
      }
    }

    // Handle signatureListId - assign signers from signature list
    let signers = [];
    if (budgetData.signatureListId) {
      try {
        const signatureList = await Signature.findById(budgetData.signatureListId).populate("signers.employeeId", "name lastName email");
        console.log("Signature list found:", signatureList);
        console.log("Signature list signers:", signatureList?.signers);
        if (signatureList && signatureList.signers && signatureList.signers.length > 0) {
          // Map signature list signers to budget signers format
          signers = signatureList.signers.map((signer, index) => {
            // Handle both populated and non-populated employeeId
            const employeeId = signer.employeeId?._id || signer.employeeId;
            const employeeName = signer.employeeId?.name || signer.name;
            const employeeLastName = signer.employeeId?.lastName || "";
            const fullName = employeeLastName ? `${employeeName} ${employeeLastName}` : employeeName;
            
            return {
              employeeId: employeeId,
              name: fullName || signer.name,
              role: signer.role,
              order: signer.order !== undefined ? signer.order : index,
              hasSigned: false,
              timeStamp: null,
              signatureUrl: null,
            };
          });
          console.log("Mapped signers for budget:", signers);
        } else {
          console.log("Signature list not found or has no signers");
        }
      } catch (error) {
        console.error("Error fetching signature list:", error);
        // Continue without signers if there's an error
      }
      // Remove signatureListId from budgetData as it's not part of the schema
      delete budgetData.signatureListId;
    } else {
      console.log("No signatureListId provided in budgetData");
      console.log("Budget data keys:", Object.keys(budgetData));
    }

    // Ensure status is set to "Draft" by default
    // Remove signers from budgetData if it exists to avoid conflicts
    const { signers: budgetDataSigners, ...restBudgetData } = budgetData;
    
    const newBudgetData = {
      ...restBudgetData,
      companyId: companyId,
      createdBy,
      status: budgetData.status || "Draft", // Explicitly set to Draft if not provided
      signers: signers.length > 0 ? signers : (budgetDataSigners || []),
      currentSignatures: 0,
      currentSignerIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log("Final budget data signers:", newBudgetData.signers);

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
    const budget = await Budget.findById(req.params.id).populate(
      "departmentId",
      "name"
    );
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
export const updateBudget = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid authentication token." });
    }

    const employeeId = decodedToken.employeeId;
    const budgetId = req.params.id;

    // בדיקת תקינות מזהה התקציב
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid budget ID format." });
    }

    // שליפת התקציב
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, message: `Budget not found: ${budgetId}` });
    }

    // חילוץ השדות מה-body
    const {
      departmentOrProjectName,
      amount,
      currency,
      startDate,
      endDate,
      notes,
      items, // מערך פריטים להוספה
      resetSigners, // בוליאני לאיפוס חתימות
    } = req.body;

    // ===== 1) עדכון שדות התקציב הכלליים =====
    if (departmentOrProjectName !== undefined) {
      budget.departmentOrProjectName = departmentOrProjectName;
    }
    if (amount !== undefined) {
      budget.amount = amount;
    }
    if (currency !== undefined) {
      budget.currency = currency;
    }
    if (startDate !== undefined) {
      budget.startDate = startDate;
    }
    if (endDate !== undefined) {
      budget.endDate = endDate;
    }
    if (notes !== undefined) {
      budget.notes = notes;
    }

    // ===== 2) איפוס חתימות (אופציונלי) =====
    // אם רוצים שאם עדכנו משהו מהותי - נמחק/נאפסת מערך signers:
    if (resetSigners) {
      budget.signers.forEach((signer) => {
        signer.hasSigned = false;
        signer.signatureUrl = null;
        signer.timeStamp = null;
      });
      budget.currentSignatures = 0;
      budget.currentSignerIndex = 0;
      budget.status = "Draft";
    }

    // ===== 3) הוספת items חדשים (אם יש) =====
    let totalSpentFromNewItems = 0;
    if (items && Array.isArray(items) && items.length > 0) {
      // הוספת employeeId לכל פריט חדש
      items.forEach((item) => {
        item.employeeId = employeeId;
      });

      // חישוב סך ההוצאה החדשה
      totalSpentFromNewItems = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );

      // הוספת הפריטים למערך
      budget.items.push(...items);

      // עדכון הסכום שנוצל
      budget.spentAmount += totalSpentFromNewItems;
    }

    // עדכון זמן העדכון
    budget.updatedAt = new Date();
    await budget.save();

    // ===== 4) התראות במקרה של חריגה מהתקציב =====
    if (budget.spentAmount > budget.amount) {
      console.log(
        `Budget exceeded for: ${budget.departmentOrProjectName}, sending notification...`
      );
      if (employeeId) {
        const notification = new Notification({
          companyId: budget.companyId,
          content: `The budget ${budget.departmentOrProjectName} has been exceeded.`,
          type: "Error",
          employeeId: employeeId,
        });
        await notification.save();
        console.log("Notification saved successfully.");
      } else {
        console.error("employeeId is missing, no notification will be sent.");
      }
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
      const department = await Department.findById(budget.departmentId);
      department.budgets.push(budget._id);
      await department.save();
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
export const getBudgetByDepartments = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    const { departmentId } = req.params; // שינוי כאן מ-query ל-params

    // בדיקת אימות
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const companyId = decodedToken.companyId;
    if (!companyId || companyId === "null" || !departmentId) {
      return res
        .status(400)
        .json({ error: "companyId and departmentId are required." });
    }

    // חיפוש על פי companyId ו-departmentId
    const budget = await Budget.findOne({ companyId, departmentId });

    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found for this department." });
    }

    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    console.error("Error fetching budget by department:", error);
    res.status(500).json({ error: error.message });
  }
};
