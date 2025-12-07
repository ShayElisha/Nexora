import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    
    // ========================
    // 1. קטלוג ומיון נכסים
    // ========================
    name: {
      type: String,
      required: true,
      trim: true,
    },
    assetType: {
      type: String,
      enum: [
        "Equipment", // ציוד
        "Machinery", // מכונות
        "Vehicle", // כלי רכב
        "Furniture", // ריהוט
        "IT", // ציוד IT
        "Office Equipment", // ציוד משרדי
        "Building", // מבנה
        "Land", // קרקע
        "Other", // אחר
      ],
      required: true,
    },
    category: {
      type: String,
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    
    // שיוך למחלקה/אתר/סניף
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site", // אם יש מודל Site
    },
    location: {
      building: { type: String, trim: true },
      floor: { type: String, trim: true },
      room: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    
    // ========================
    // 2. פרטי נכס מורחבים
    // ========================
    serialNumber: {
      type: String,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      index: true,
    },
    rfidTag: {
      type: String,
      trim: true,
      index: true,
    },
    
    // פרטי רכישה
    purchaseDate: {
      type: Date,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suppliers",
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    purchaseCurrency: {
      type: String,
      default: "ILS",
      uppercase: true,
    },
    purchaseDocuments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    
    // אחריות
    warrantyStartDate: {
      type: Date,
    },
    warrantyEndDate: {
      type: Date,
    },
    warrantyProvider: {
      type: String,
      trim: true,
    },
    warrantyDetails: {
      type: String,
      trim: true,
    },
    
    // חוזי שירות
    serviceContracts: [
      {
        provider: { type: String, required: true },
        contractNumber: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        cost: { type: Number, default: 0 },
        currency: { type: String, default: "ILS" },
        coverage: { type: String }, // מה מכוסה בחוזה
        renewalDate: { type: Date },
        isActive: { type: Boolean, default: true },
        notes: { type: String },
      },
    ],
    
    // תמונות ומסמכים
    images: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    documents: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        documentType: {
          type: String,
          enum: [
            "Invoice",
            "Warranty",
            "Manual",
            "Certificate",
            "License",
            "Insurance",
            "Other",
          ],
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    
    // נתוני שימוש
    usageData: {
      totalHours: { type: Number, default: 0 }, // שעות שימוש
      totalKilometers: { type: Number, default: 0 }, // קילומטרים (לרכבים)
      lastUsedDate: { type: Date },
      usageRate: { type: Number, default: 0 }, // אחוז שימוש
    },
    
    // ========================
    // 3. מעקב תחזוקה
    // ========================
    maintenanceSchedule: {
      type: {
        type: String,
        enum: ["Time", "Hours", "Kilometers", "Custom"],
      },
      interval: { type: Number }, // כל כמה זמן/שעות/ק"מ
      intervalUnit: {
        type: String,
        enum: ["Days", "Months", "Hours", "Kilometers"],
      },
      lastMaintenanceDate: { type: Date },
      nextMaintenanceDate: { type: Date },
      nextMaintenanceHours: { type: Number },
      nextMaintenanceKilometers: { type: Number },
    },
    
    maintenanceHistory: [
      {
        workOrderNumber: { type: String },
        maintenanceType: {
          type: String,
          enum: ["Preventive", "Corrective", "Emergency", "Inspection"],
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        serviceProvider: { type: String },
        date: { type: Date, required: true },
        cost: { type: Number, default: 0 },
        currency: { type: String, default: "ILS" },
        description: { type: String },
        partsReplaced: [
          {
            partName: { type: String },
            partNumber: { type: String },
            quantity: { type: Number },
            cost: { type: Number },
          },
        ],
        hoursAtMaintenance: { type: Number },
        kilometersAtMaintenance: { type: Number },
        nextMaintenanceDate: { type: Date },
        documents: [
          {
            fileName: { type: String },
            fileUrl: { type: String },
          },
        ],
      },
    ],
    
    // חלקי חילוף לפי נכס
    spareParts: [
      {
        partName: { type: String, required: true },
        partNumber: { type: String },
        quantity: { type: Number, default: 0 },
        minQuantity: { type: Number, default: 0 },
        unitCost: { type: Number, default: 0 },
        supplierId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Suppliers",
        },
        lastOrderDate: { type: Date },
      },
    ],
    
    // ========================
    // 4. ביטוחים וניהול סיכונים
    // ========================
    insurancePolicies: [
      {
        policyNumber: { type: String, required: true },
        insuranceCompany: { type: String, required: true },
        policyType: {
          type: String,
          enum: [
            "Property",
            "Liability",
            "Vehicle",
            "Equipment",
            "Comprehensive",
            "Other",
          ],
        },
        coverageAmount: { type: Number, required: true },
        currency: { type: String, default: "ILS" },
        premium: { type: Number, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        renewalDate: { type: Date },
        isActive: { type: Boolean, default: true },
        claims: [
          {
            claimNumber: { type: String },
            claimDate: { type: Date },
            claimAmount: { type: Number },
            status: {
              type: String,
              enum: ["Pending", "Approved", "Rejected", "Paid"],
            },
            description: { type: String },
          },
        ],
        documents: [
          {
            fileName: { type: String },
            fileUrl: { type: String },
          },
        ],
      },
    ],
    
    // ========================
    // 5. ניהול פחת
    // ========================
    depreciation: {
      method: {
        type: String,
        enum: ["Straight Line", "Accelerated", "Custom", "None"],
        default: "Straight Line",
      },
      usefulLife: { type: Number }, // שנים
      salvageValue: { type: Number, default: 0 }, // ערך שיורי
      annualDepreciation: { type: Number, default: 0 },
      accumulatedDepreciation: { type: Number, default: 0 },
      currentValue: { type: Number }, // ערך נוכחי
      lastCalculatedDate: { type: Date },
    },
    
    depreciationHistory: [
      {
        period: { type: String }, // "2024-01" או "2024"
        depreciationAmount: { type: Number },
        accumulatedDepreciation: { type: Number },
        currentValue: { type: Number },
        calculatedAt: { type: Date, default: Date.now },
      },
    ],
    
    // ========================
    // 6. מיקום וסטטוס בזמן אמת
    // ========================
    gpsTracking: {
      enabled: { type: Boolean, default: false },
      lastKnownLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
        timestamp: { type: Date },
      },
      trackingDeviceId: { type: String },
    },
    
    rfidTracking: {
      enabled: { type: Boolean, default: false },
      lastScannedLocation: {
        locationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "WarehouseLocation",
        },
        timestamp: { type: Date },
      },
    },
    
    status: {
      type: String,
      enum: [
        "Active", // פעיל
        "In Maintenance", // בתחזוקה
        "Out of Service", // לא תקין
        "Retired", // יצא משימוש
        "Sold", // נמכר
        "Stolen", // גנוב
        "Disposed", // הושלך
      ],
      default: "Active",
      index: true,
    },
    
    // העברות בין מחלקות/עובדים
    transferHistory: [
      {
        fromEmployeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        toEmployeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        fromDepartmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
        toDepartmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
        transferredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        transferDate: { type: Date, default: Date.now },
        reason: { type: String },
        transferType: {
          type: String,
          enum: ["Permanent", "Temporary", "Loan", "Return"],
          default: "Permanent",
        },
        expectedReturnDate: { type: Date }, // אם זמני
        actualReturnDate: { type: Date },
      },
    ],
    
    // ========================
    // 7. ניהול עלויות נכס
    // ========================
    costs: {
      totalMaintenanceCost: { type: Number, default: 0 },
      totalOperatingCost: { type: Number, default: 0 }, // דלק, אנרגיה
      totalPurchaseCost: { type: Number, default: 0 },
      annualMaintenanceCost: { type: Number, default: 0 },
      tco: { type: Number, default: 0 }, // Total Cost of Ownership
      lastCalculatedDate: { type: Date },
    },
    
    costHistory: [
      {
        period: { type: String },
        maintenanceCost: { type: Number, default: 0 },
        operatingCost: { type: Number, default: 0 },
        totalCost: { type: Number, default: 0 },
        calculatedAt: { type: Date, default: Date.now },
      },
    ],
    
    // ========================
    // 8. הערכת ביצועים ויעילות
    // ========================
    performance: {
      utilizationRate: { type: Number, default: 0 }, // אחוז שימוש
      efficiency: { type: Number, default: 0 }, // יעילות
      downtime: { type: Number, default: 0 }, // זמן השבתה (שעות)
      mtbf: { type: Number }, // Mean Time Between Failures
      mttr: { type: Number }, // Mean Time To Repair
      lastCalculatedDate: { type: Date },
    },
    
    // ========================
    // 9. מחזור חיי נכס
    // ========================
    lifecycle: {
      stage: {
        type: String,
        enum: [
          "New", // חדש
          "Active", // פעיל
          "Used", // משומש
          "Refurbished", // מתוקן
          "End of Life", // סוף חיים
        ],
        default: "New",
      },
      plannedReplacementDate: { type: Date },
      actualReplacementDate: { type: Date },
      disposalDate: { type: Date },
      disposalMethod: {
        type: String,
        enum: ["Sold", "Scrapped", "Donated", "Recycled", "Other"],
      },
      disposalValue: { type: Number },
    },
    
    // ========================
    // 10. אינטגרציות
    // ========================
    assignedTo: {
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      employeeName: { type: String }, // לשמירה מהירה
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
      departmentName: { type: String },
      assignedDate: { type: Date, default: Date.now },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
      assignmentReason: { type: String },
      expectedReturnDate: { type: Date }, // אם זה השאלה זמנית
    },
    
    // קישור לחשבונות כספיים
    financeRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Finance",
    },
    
    // קישור למלאי (אם הנכס הוא חלק מהמלאי)
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    },
    
    // ========================
    // שדות נוספים
    // ========================
    description: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
    specifications: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // מפרטים דינמיים
    },
    notes: {
      type: String,
      trim: true,
    },
    
    // מי יצר/עדכן
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
assetSchema.index({ companyId: 1, assetType: 1 });
assetSchema.index({ companyId: 1, status: 1 });
assetSchema.index({ companyId: 1, departmentId: 1 });
assetSchema.index({ serialNumber: 1 });
assetSchema.index({ barcode: 1 });
assetSchema.index({ rfidTag: 1 });
assetSchema.index({ "maintenanceSchedule.nextMaintenanceDate": 1 });
assetSchema.index({ "depreciation.lastCalculatedDate": 1 });
assetSchema.index({ "insurancePolicies.endDate": 1 });
assetSchema.index({ "lifecycle.plannedReplacementDate": 1 });

const Asset =
  mongoose.models.Asset || mongoose.model("Asset", assetSchema);

export default Asset;

