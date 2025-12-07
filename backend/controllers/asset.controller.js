import Asset from "../models/Asset.model.js";
import Employee from "../models/employees.model.js";
import Department from "../models/department.model.js";
import Finance from "../models/finance.model.js";
import Notification from "../models/notification.model.js";
import mongoose from "mongoose";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../utils/errorMessages.js";

// ========================
// CRUD Operations
// ========================

/**
 * Create a new asset
 * Requires: protectRoute, extractCompanyId middleware
 */
export const createAsset = async (req, res) => {
  try {
    // Get companyId and user from middleware
    const companyId = req.companyId;
    const employeeId = req.user._id;

    const assetData = {
      ...req.body,
      companyId,
      createdBy: employeeId,
    };

  // חישוב ערך נוכחי אם יש פרטי רכישה
  if (assetData.purchasePrice && assetData.depreciation) {
    assetData.depreciation.currentValue = assetData.purchasePrice;
  }

  const asset = await Asset.create(assetData);

  // יצירת רשומה פיננסית אם יש מחיר רכישה
  if (asset.purchasePrice > 0) {
    try {
      const financeRecord = await Finance.create({
        companyId,
        transactionType: "Expense",
        amount: asset.purchasePrice,
        currency: asset.purchaseCurrency || "ILS",
        description: `רכישת נכס: ${asset.name}`,
        transactionDate: asset.purchaseDate || new Date(),
        category: "Asset Purchase",
        relatedEntity: {
          type: "Asset",
          id: asset._id.toString(),
        },
      });

      asset.financeRecordId = financeRecord._id;
      await asset.save();
    } catch (error) {
      console.error("Error creating finance record:", error);
      // לא נכשיל את יצירת הנכס אם יצירת הרשומה הפיננסית נכשלה
    }
  }

  res.status(201).json({
    success: true,
    message: SUCCESS_MESSAGES.CREATED,
    data: asset,
  });
} catch (error) {
  console.error("Error creating asset:", error);
  res.status(500).json({
    success: false,
    message: ERROR_MESSAGES.OPERATION_FAILED,
    error: error.message,
  });
}
};

/**
 * Get all assets
 * Requires: protectRoute, extractCompanyId middleware
 */
export const getAllAssets = async (req, res) => {
  try {
    // Get companyId from middleware
    const companyId = req.companyId;

  const {
    assetType,
    status,
    departmentId,
    search,
    page = 1,
    limit = 50,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = { companyId };

  if (assetType) query.assetType = assetType;
  if (status) query.status = status;
  if (departmentId) query.departmentId = departmentId;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { serialNumber: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
      { manufacturer: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const assets = await Asset.find(query)
    .populate("departmentId", "name")
    .populate("assignedTo", "name lastName")
    .populate("supplierId", "SupplierName")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Asset.countDocuments(query);

  res.json({
    success: true,
    data: assets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.OPERATION_FAILED,
      error: error.message,
    });
  }
};

/**
 * Get asset by ID
 * Requires: protectRoute, extractCompanyId middleware
 */
export const getAssetById = async (req, res) => {
  try {
    // Get companyId from middleware
    const companyId = req.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  })
    .populate("departmentId", "name")
    .populate("assignedTo", "name lastName email")
    .populate("supplierId", "SupplierName Contact Email")
    .populate("createdBy", "name lastName")
    .populate("updatedBy", "name lastName");

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND,
      error: "Asset not found",
    });
  }

  res.json({
    success: true,
    data: asset,
  });
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.OPERATION_FAILED,
      error: error.message,
    });
  }
};

/**
 * Update asset
 * Requires: protectRoute, extractCompanyId middleware
 */
export const updateAsset = async (req, res) => {
  try {
    // Get companyId and user from middleware
    const companyId = req.companyId;
    const employeeId = req.user._id;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND,
      error: "Asset not found",
    });
  }

  // Update fields
  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      asset[key] = req.body[key];
    }
  });

  asset.updatedBy = employeeId;
  await asset.save();

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED,
    data: asset,
  });
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.OPERATION_FAILED,
      error: error.message,
    });
  }
};

/**
 * Delete asset
 * Requires: protectRoute, extractCompanyId middleware
 */
export const deleteAsset = async (req, res) => {
  try {
    // Get companyId from middleware
    const companyId = req.companyId;

  const asset = await Asset.findOneAndDelete({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: ERROR_MESSAGES.NOT_FOUND,
      error: "Asset not found",
    });
  }

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.DELETED,
  });
} catch (error) {
  console.error("Error deleting asset:", error);
  res.status(500).json({
    success: false,
    message: ERROR_MESSAGES.OPERATION_FAILED,
    error: error.message,
  });
}
};

// ========================
// Maintenance Operations
// ========================

/**
 * Add maintenance to asset
 * Requires: protectRoute, extractCompanyId middleware
 */
export const addMaintenance = async (req, res) => {
  try {
    // Get companyId and user from middleware
    const companyId = req.companyId;
    const employeeId = req.user._id;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  const maintenanceData = {
    ...req.body,
    performedBy: employeeId,
    date: req.body.date || new Date(),
  };

  asset.maintenanceHistory.push(maintenanceData);

  // עדכון תאריך תחזוקה אחרונה
  asset.maintenanceSchedule.lastMaintenanceDate = maintenanceData.date;

  // חישוב תאריך תחזוקה הבא
  if (asset.maintenanceSchedule.type && asset.maintenanceSchedule.interval) {
    const nextDate = calculateNextMaintenanceDate(
      maintenanceData.date,
      asset.maintenanceSchedule
    );
    asset.maintenanceSchedule.nextMaintenanceDate = nextDate;
  }

  // עדכון עלויות תחזוקה
  asset.costs.totalMaintenanceCost += maintenanceData.cost || 0;
  asset.costs.lastCalculatedDate = new Date();

  await asset.save();

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.UPDATED,
    data: asset,
  });
  } catch (error) {
    console.error("Error adding maintenance:", error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.OPERATION_FAILED,
      error: error.message,
    });
  }
};

/**
 * חישוב תאריך תחזוקה הבא
 */
const calculateNextMaintenanceDate = (lastDate, schedule) => {
  const date = new Date(lastDate);
  const { type, interval, intervalUnit } = schedule;

  if (type === "Time") {
    if (intervalUnit === "Days") {
      date.setDate(date.getDate() + interval);
    } else if (intervalUnit === "Months") {
      date.setMonth(date.getMonth() + interval);
    }
  }

  return date;
};

/**
 * קבלת היסטוריית תחזוקה
 */
export const getMaintenanceHistory = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  }).select("maintenanceHistory");

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  res.json({
    success: true,
    data: asset.maintenanceHistory,
  });
} catch (error) {
  console.error("Error fetching maintenance history:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Error fetching maintenance history",
  });
}
};

// ========================
// Depreciation Operations
// ========================

/**
 * חישוב פחת לנכס
 */
export const calculateDepreciation = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  const { method, period } = req.body;

  if (method) {
    asset.depreciation.method = method;
  }

  const depreciationResult = calculateAssetDepreciation(asset, period);

  // עדכון שדות פחת
  asset.depreciation.annualDepreciation = depreciationResult.annualDepreciation;
  asset.depreciation.accumulatedDepreciation +=
    depreciationResult.periodDepreciation;
  asset.depreciation.currentValue = depreciationResult.currentValue;
  asset.depreciation.lastCalculatedDate = new Date();

  // הוספה להיסטוריה
  asset.depreciationHistory.push({
    period: period || new Date().toISOString().slice(0, 7),
    depreciationAmount: depreciationResult.periodDepreciation,
    accumulatedDepreciation: asset.depreciation.accumulatedDepreciation,
    currentValue: depreciationResult.currentValue,
  });

  await asset.save();

  res.json({
    success: true,
    data: {
      asset,
      depreciation: depreciationResult,
    },
  });
} catch (error) {
  console.error("Error calculating depreciation:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Error calculating depreciation",
  });
}
};

/**
 * חישוב פחת לפי שיטה
 */
const calculateAssetDepreciation = (asset, period = null) => {
  const {
    purchasePrice = 0,
    depreciation: { method, usefulLife, salvageValue = 0 },
    depreciation: { accumulatedDepreciation = 0 },
  } = asset;

  if (!usefulLife || usefulLife === 0) {
    return {
      annualDepreciation: 0,
      periodDepreciation: 0,
      currentValue: purchasePrice,
    };
  }

  let annualDepreciation = 0;
  let periodDepreciation = 0;

  if (method === "Straight Line") {
    annualDepreciation = (purchasePrice - salvageValue) / usefulLife;
    periodDepreciation = annualDepreciation / 12; // חודשי
  } else if (method === "Accelerated") {
    // Double Declining Balance
    const rate = 2 / usefulLife;
    const currentValue = purchasePrice - accumulatedDepreciation;
    annualDepreciation = currentValue * rate;
    periodDepreciation = annualDepreciation / 12;
  }

  const newAccumulatedDepreciation = accumulatedDepreciation + periodDepreciation;
  const currentValue = Math.max(
    purchasePrice - newAccumulatedDepreciation,
    salvageValue
  );

  return {
    annualDepreciation,
    periodDepreciation,
    currentValue,
    accumulatedDepreciation: newAccumulatedDepreciation,
  };
};

/**
 * חישוב פחת לכל הנכסים
 */
export const calculateAllDepreciations = async (req, res) => {
  try {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const assets = await Asset.find({
    companyId,
    "depreciation.method": { $ne: "None" },
    purchasePrice: { $gt: 0 },
  });

  const results = [];

  for (const asset of assets) {
    const depreciationResult = calculateAssetDepreciation(asset);
    asset.depreciation.accumulatedDepreciation +=
      depreciationResult.periodDepreciation;
    asset.depreciation.currentValue = depreciationResult.currentValue;
    asset.depreciation.lastCalculatedDate = new Date();
    await asset.save();

    results.push({
      assetId: asset._id,
      assetName: asset.name,
      depreciation: depreciationResult,
    });
  }

  res.json({
    success: true,
    data: results,
    message: `Depreciation calculated for ${results.length} assets`,
  });
} catch (error) {
  console.error("Error calculating all depreciations:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Error calculating depreciations",
  });
}
};

// ========================
// Performance Analytics
// ========================

/**
 * חישוב ביצועים לנכס
 */
export const calculatePerformance = async (req, res) => {
  try {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  // חישוב Utilization Rate
  const daysSincePurchase = asset.purchaseDate
    ? Math.floor(
        (new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24)
      )
    : 0;
  const expectedUsage = daysSincePurchase * 8; // שעות צפויות (8 שעות ביום)
  const utilizationRate =
    expectedUsage > 0
      ? (asset.usageData.totalHours / expectedUsage) * 100
      : 0;

  // חישוב Downtime
  const maintenanceDays = asset.maintenanceHistory.length * 0.5; // נניח חצי יום לכל תחזוקה
  const downtime = maintenanceDays * 8; // שעות

  // חישוב MTBF (Mean Time Between Failures)
  const failures = asset.maintenanceHistory.filter(
    (m) => m.maintenanceType === "Corrective" || m.maintenanceType === "Emergency"
  ).length;
  const mtbf =
    failures > 0 ? asset.usageData.totalHours / failures : asset.usageData.totalHours;

  // חישוב MTTR (Mean Time To Repair)
  const repairMaintenances = asset.maintenanceHistory.filter(
    (m) => m.maintenanceType === "Corrective"
  );
  const totalRepairTime = repairMaintenances.reduce(
    (sum, m) => sum + (m.duration || 0),
    0
  );
  const mttr =
    repairMaintenances.length > 0
      ? totalRepairTime / repairMaintenances.length
      : 0;

  // עדכון נתוני ביצועים
  asset.performance.utilizationRate = Math.min(100, Math.max(0, utilizationRate));
  asset.performance.downtime = downtime;
  asset.performance.mtbf = mtbf;
  asset.performance.mttr = mttr;
  asset.performance.lastCalculatedDate = new Date();

  await asset.save();

  res.json({
    success: true,
    data: {
      asset,
      performance: asset.performance,
    },
  });
} catch (error) {
  console.error("Error calculating performance:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Error calculating performance",
  });
}
};

/**
 * דוח ביצועים לכל הנכסים
 */
export const getPerformanceReport = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const { assetType, minUtilization, maxUtilization } = req.query;

  const query = { companyId };
  if (assetType) query.assetType = assetType;

  const assets = await Asset.find(query).select(
    "name assetType status performance costs usageData"
  );

  let filteredAssets = assets;

  if (minUtilization || maxUtilization) {
    filteredAssets = assets.filter((asset) => {
      const utilization = asset.performance?.utilizationRate || 0;
      if (minUtilization && utilization < parseFloat(minUtilization)) return false;
      if (maxUtilization && utilization > parseFloat(maxUtilization)) return false;
      return true;
    });
  }

  // נכסים עם תחזוקה גבוהה
  const highMaintenanceAssets = filteredAssets
    .filter((asset) => asset.costs?.totalMaintenanceCost > 0)
    .sort(
      (a, b) =>
        b.costs.totalMaintenanceCost - a.costs.totalMaintenanceCost
    )
    .slice(0, 10);

  // נכסים לא בשימוש
  const unusedAssets = filteredAssets.filter(
    (asset) => (asset.performance?.utilizationRate || 0) < 10
  );

  res.json({
    success: true,
    data: {
      totalAssets: filteredAssets.length,
      highMaintenanceAssets,
      unusedAssets,
      averageUtilization:
        filteredAssets.reduce(
          (sum, a) => sum + (a.performance?.utilizationRate || 0),
          0
        ) / filteredAssets.length || 0,
    },
  });
};

// ========================
// Cost Management
// ========================

/**
 * חישוב TCO (Total Cost of Ownership)
 */
export const calculateTCO = async (req, res) => {
  try {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  const purchaseCost = asset.purchasePrice || 0;
  const maintenanceCost = asset.costs?.totalMaintenanceCost || 0;
  const operatingCost = asset.costs?.totalOperatingCost || 0;
  const insuranceCost = asset.insurancePolicies?.reduce(
    (sum, policy) => sum + (policy.premium || 0),
    0
  ) || 0;

  const tco = purchaseCost + maintenanceCost + operatingCost + insuranceCost;

  asset.costs.tco = tco;
  asset.costs.totalPurchaseCost = purchaseCost;
  asset.costs.totalMaintenanceCost = maintenanceCost;
  asset.costs.totalOperatingCost = operatingCost;
  asset.costs.lastCalculatedDate = new Date();

  await asset.save();

  res.json({
    success: true,
    data: {
      asset,
      tco: {
        purchaseCost,
        maintenanceCost,
        operatingCost,
        insuranceCost,
        total: tco,
      },
    },
  });
} catch (error) {
  console.error("Error fetching performance report:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Error fetching performance report",
  });
}
};

// ========================
// Insurance Management
// ========================

/**
 * הוספת פוליסת ביטוח
 */
export const addInsurancePolicy = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  asset.insurancePolicies.push(req.body);
  await asset.save();

  res.json({
    success: true,
    data: asset,
  });
};

/**
 * עדכון פוליסת ביטוח
 */
export const updateInsurancePolicy = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  const policyIndex = asset.insurancePolicies.findIndex(
    (p) => p._id.toString() === req.params.policyId
  );

  if (policyIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Insurance policy not found",
    });
  }

  Object.keys(req.body).forEach((key) => {
    if (req.body[key] !== undefined) {
      asset.insurancePolicies[policyIndex][key] = req.body[key];
    }
  });

  await asset.save();

  res.json({
    success: true,
    data: asset,
  });
};

// ========================
// Transfer Management
// ========================

/**
 * העברת נכס בין מחלקות
 */
export const transferAsset = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;
  const employeeId = decoded.employeeId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  const { toDepartmentId, toEmployeeId, reason, transferType = "Permanent", expectedReturnDate } = req.body;

  // שמירת מידע על העברות קודמות
  const fromEmployeeId = asset.assignedTo?.employeeId;
  const fromDepartmentId = asset.departmentId;

  // עדכון הקצאה
  if (toEmployeeId) {
    const toEmployee = await Employee.findById(toEmployeeId);
    const toDepartment = toDepartmentId ? await Department.findById(toDepartmentId) : null;
    
    asset.assignedTo = {
      employeeId: toEmployeeId,
      employeeName: toEmployee ? `${toEmployee.name} ${toEmployee.lastName || ''}`.trim() : undefined,
      departmentId: toDepartmentId || toDepartment?._id,
      departmentName: toDepartment?.name,
      assignedDate: new Date(),
      assignedBy: employeeId,
      assignmentReason: reason,
      expectedReturnDate: transferType === "Temporary" ? expectedReturnDate : undefined,
    };
  } else if (toDepartmentId) {
    const toDepartment = await Department.findById(toDepartmentId);
    asset.assignedTo = {
      ...asset.assignedTo,
      departmentId: toDepartmentId,
      departmentName: toDepartment?.name,
      assignedDate: new Date(),
      assignedBy: employeeId,
      assignmentReason: reason,
    };
  }

  // עדכון מחלקה
  if (toDepartmentId) {
    asset.departmentId = toDepartmentId;
  }

  // הוספה להיסטוריית העברות
  asset.transferHistory.push({
    fromEmployeeId,
    toEmployeeId,
    fromDepartmentId,
    toDepartmentId,
    transferredBy: employeeId,
    transferDate: new Date(),
    reason,
    transferType,
    expectedReturnDate: transferType === "Temporary" ? expectedReturnDate : undefined,
  });

  await asset.save();

  // יצירת התראה לעובד/מחלקה החדשה
  if (toEmployeeId) {
    try {
      await Notification.create({
        companyId,
        employeeId: toEmployeeId,
        type: "asset_assigned",
        title: "נכס הוקצה אליך",
        content: `הנכס "${asset.name}" הוקצה אליך${reason ? `: ${reason}` : ''}`,
        priority: "medium",
        relatedEntity: {
          type: "Asset",
          id: asset._id,
        },
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
    }
  }

  res.json({
    success: true,
    data: asset,
  });
};

// ========================
// Assignment Management
// ========================

/**
 * הקצאת נכס לעובד
 */
export const assignAsset = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  const { employeeId, departmentId, reason, expectedReturnDate } = req.body;

  // בדיקה שהעובד קיים ושייך לחברה
  const employee = await Employee.findOne({
    _id: employeeId,
    companyId,
  });

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  // קבלת מחלקה אם לא סופקה
  let finalDepartmentId = departmentId || asset.departmentId;
  const department = finalDepartmentId ? await Department.findById(finalDepartmentId) : null;

  // שמירת מידע על הקצאה קודמת
  const fromEmployeeId = asset.assignedTo?.employeeId;
  const fromDepartmentId = asset.departmentId;

  // עדכון הקצאה עם המבנה החדש
  asset.assignedTo = {
    employeeId: employeeId,
    employeeName: `${employee.name} ${employee.lastName || ''}`.trim(),
    departmentId: finalDepartmentId,
    departmentName: department?.name,
    assignedDate: new Date(),
    assignedBy: decoded.employeeId,
    assignmentReason: reason,
    expectedReturnDate: expectedReturnDate,
  };

  // עדכון מחלקה אם סופקה
  if (departmentId) {
    asset.departmentId = departmentId;
  }

  // הוספה להיסטוריית העברות אם יש שינוי
  if (fromEmployeeId?.toString() !== employeeId || fromDepartmentId?.toString() !== finalDepartmentId?.toString()) {
    asset.transferHistory.push({
      fromEmployeeId,
      toEmployeeId: employeeId,
      fromDepartmentId,
      toDepartmentId: finalDepartmentId,
      transferredBy: decoded.employeeId,
      transferDate: new Date(),
      reason: reason || "Asset assignment",
      transferType: "Permanent",
    });
  }

  await asset.save();

  // יצירת התראה
  try {
    await Notification.create({
      companyId,
      employeeId: employeeId,
      type: "asset_assigned",
      title: "נכס הוקצה אליך",
      content: `הנכס "${asset.name}" הוקצה אליך${reason ? `: ${reason}` : ''}`,
      priority: "medium",
      relatedEntity: {
        type: "Asset",
        id: asset._id,
      },
    });
  } catch (notifError) {
    console.error("Error creating notification:", notifError);
  }

  res.json({
    success: true,
    data: asset,
  });
};

/**
 * הסרת הקצאה
 */
export const unassignAsset = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  asset.assignedTo = null;
  asset.assignedDate = null;
  await asset.save();

  res.json({
    success: true,
    data: asset,
  });
};

// ========================
// Lifecycle Management
// ========================

/**
 * עדכון שלב חיים
 */
export const updateLifecycleStage = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const asset = await Asset.findOne({
    _id: req.params.id,
    companyId,
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: "Asset not found",
    });
  }

  const { stage, disposalMethod, disposalValue } = req.body;

  asset.lifecycle.stage = stage;

  if (stage === "End of Life") {
    asset.lifecycle.actualReplacementDate = new Date();
    asset.status = "Retired";
  }

  if (disposalMethod) {
    asset.lifecycle.disposalMethod = disposalMethod;
    asset.lifecycle.disposalDate = new Date();
    asset.lifecycle.disposalValue = disposalValue || 0;
    asset.status = "Disposed";
  }

  await asset.save();

  res.json({
    success: true,
    data: asset,
  });
};

// ========================
// Reports & Analytics
// ========================

/**
 * דוח נכסים קרובים לתחזוקה
 */
export const getUpcomingMaintenance = async (req, res) => {
  try {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const { days = 30 } = req.query;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const assets = await Asset.find({
    companyId,
    status: { $in: ["Active", "In Maintenance"] },
    "maintenanceSchedule.nextMaintenanceDate": {
      $lte: futureDate,
      $gte: new Date(),
    },
  })
    .populate("departmentId", "name")
    .select("name assetType status maintenanceSchedule departmentId")
    .sort("maintenanceSchedule.nextMaintenanceDate");

  res.json({
    success: true,
    data: assets,
  });
  } catch (error) {
    console.error("Error fetching upcoming maintenance:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching upcoming maintenance",
    });
  }
};

/**
 * דוח נכסים עם ביטוח שפוג
 */
export const getExpiringInsurance = async (req, res) => {
  try {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const { days = 30 } = req.query;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  const assets = await Asset.find({
    companyId,
    "insurancePolicies.isActive": true,
    "insurancePolicies.endDate": {
      $lte: futureDate,
      $gte: new Date(),
    },
  })
    .select("name assetType insurancePolicies")
    .lean();

  const expiringPolicies = [];

  assets.forEach((asset) => {
    asset.insurancePolicies
      .filter(
        (policy) =>
          policy.isActive &&
          policy.endDate <= futureDate &&
          policy.endDate >= new Date()
      )
      .forEach((policy) => {
        expiringPolicies.push({
          assetId: asset._id,
          assetName: asset.name,
          assetType: asset.assetType,
          policy: policy,
        });
      });
  });

  res.json({
    success: true,
    data: expiringPolicies,
  });
} catch (error) {
  console.error("Error fetching expiring insurance:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Error fetching expiring insurance",
  });
}
};

/**
 * דוח נכסים לפי מחלקה
 */
export const getAssetsByDepartment = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const companyId = decoded.companyId;

  const assets = await Asset.aggregate([
    {
      $match: { companyId: new mongoose.Types.ObjectId(companyId) },
    },
    {
      $group: {
        _id: "$departmentId",
        count: { $sum: 1 },
        totalValue: { $sum: "$depreciation.currentValue" },
        assets: { $push: "$$ROOT" },
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "_id",
        foreignField: "_id",
        as: "department",
      },
    },
  ]);

  res.json({
    success: true,
    data: assets,
  });
};

