import mongoose from "mongoose";

const payRateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true, // לאופטימיזציה של שאילתות לפי חברה
    },
    rateType: {
      type: String,
      enum: [
        "Regular", // שעות רגילות (100%)
        "Overtime125", // שעות נוספות ראשונות (125%)
        "Overtime150", // שעות נוספות נוספות (150%)
        "Night", // משמרת לילה (למשל, 120%)
        "Holiday", // חגים (למשל, 150%)
        "RestDay", // יום מנוחה (למשל, 150%)
        "Custom", // תעריף מותאם אישית
      ],
      required: true,
    },
    multiplier: {
      type: Number,
      required: true,
      min: 1, // מינימום 100% (1.0)
      validate: {
        validator: Number.isFinite,
        message: "multiplier must be a valid number",
      },
    },
    description: {
      type: String,
      default: "", // תיאור אופציונלי, לדוגמה: "תעריף עבור חגים יהודיים"
      trim: true,
    },
    fullTimeHours: {
      type: Number,
      min: 0, // מינימום 0 שעות
      validate: {
        validator: Number.isFinite,
        message: "fullTimeHours must be a valid number",
      },
    },
    hoursThreshold: {
      type: Number,
      min: 0, // מינימום 0 שעות
      validate: {
        validator: Number.isFinite,
        message: "hoursThreshold must be a valid number",
      },
    },

    isActive: {
      type: Boolean,
      default: true, // האם התעריף פעיל או הופסק
    },
    workHours: {
      startTime: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // ולידציה לפורמט HH:MM
        default: null,
      },
      endTime: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        default: null,
      },
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

// אינדקס משולב לחיפוש מהיר לפי companyId ו-rateType
payRateSchema.index({ companyId: 1, rateType: 1 });

// ולידציה להתאמת multiplier ל-rateType
payRateSchema.pre("save", function (next) {
  const defaultMultipliers = {
    Regular: 1.0,
    Overtime125: 1.25,
    Overtime150: 1.5,
    Night: 1.2,
    Holiday: 1.5,
    RestDay: 1.5,
  };

  // אם rateType אינו Custom, ודא שה-multiplier תואם לערך ברירת המחדל (אופציונלי)
  if (this.rateType !== "Custom" && defaultMultipliers[this.rateType]) {
    if (this.multiplier !== defaultMultipliers[this.rateType]) {
      console.warn(
        `Multiplier for ${this.rateType} is set to ${
          this.multiplier
        }, default is ${defaultMultipliers[this.rateType]}`
      );
    }
  }

  next();
});

const PayRate = mongoose.model("PayRate", payRateSchema);
export default PayRate;
