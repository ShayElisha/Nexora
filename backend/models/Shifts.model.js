import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    hoursWorked: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "hoursWorked must be a valid number",
      },
    },
    hourlySalary: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "hourlySalary must be a valid number",
      },
    },
    totalPay: {
      type: Number,
      required: false,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "totalPay must be a valid number",
      },
    },
    shiftDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    shiftType: {
      type: String,
      enum: ["Day", "Night"],
      default: "Day",
    },
    dayType: {
      type: String,
      enum: ["Regular", "Holiday", "RestDay"],
      default: "Regular",
    },
    payRateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayRate",
      required: false, // תעריף בסיסי (למשל, Regular או Night)
    },
    overtimeHours: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "overtimeHours must be a valid number",
      },
    },
    shiftBreakdown: [
      {
        rateType: {
          type: String,
          enum: [
            "Regular",
            "Overtime125",
            "Overtime150",
            "Night",
            "Holiday",
            "RestDay",
            "Custom",
          ],
          required: true,
        },
        hours: {
          type: Number,
          min: 0,
          required: true,
          validate: {
            validator: Number.isFinite,
            message: "hours must be a valid number",
          },
        },
        multiplier: {
          type: Number,
          min: 1,
          required: true,
          validate: {
            validator: Number.isFinite,
            message: "multiplier must be a valid number",
          },
        },
        payRateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PayRate",
          required: false,
        },
      },
    ],
  },
  { timestamps: true }
);

// ולידציה לוודא ש-endTime מאוחר מ-startTime
shiftSchema.pre("save", function (next) {
  if (this.endTime && this.startTime && this.endTime <= this.startTime) {
    return next(new Error("endTime must be after startTime"));
  }
  next();
});

// ולידציה וחישוב totalPay ו-overtimeHours
shiftSchema.pre("save", async function (next) {
  if (this.isModified("shiftBreakdown") || this.isModified("hoursWorked")) {
    // בדיקה שסכום השעות ב-shiftBreakdown שווה ל-hoursWorked
    const breakdownHours = this.shiftBreakdown.reduce(
      (sum, part) => sum + part.hours,
      0
    );
    if (Math.abs(breakdownHours - this.hoursWorked) > 0.01) {
      return next(
        new Error("Sum of shiftBreakdown hours must equal hoursWorked")
      );
    }

    // חישוב totalPay
    this.totalPay = parseFloat(
      this.shiftBreakdown
        .reduce(
          (sum, part) => sum + part.hours * this.hourlySalary * part.multiplier,
          0
        )
        .toFixed(2)
    );

    // חישוב overtimeHours
    this.overtimeHours = parseFloat(
      this.shiftBreakdown
        .filter((part) =>
          ["Overtime125", "Overtime150"].includes(part.rateType)
        )
        .reduce((sum, part) => sum + part.hours, 0)
        .toFixed(2)
    );
  }
  next();
});

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;
