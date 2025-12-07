import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      time: {
        type: Date,
        required: false,
      },
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      method: {
        type: String,
        enum: ["manual", "biometric", "qr_code", "mobile_app", "web"],
        default: "manual",
      },
    },
    checkOut: {
      time: {
        type: Date,
        required: false,
      },
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      method: {
        type: String,
        enum: ["manual", "biometric", "qr_code", "mobile_app", "web"],
        default: "manual",
      },
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "holiday", "weekend"],
      default: "present",
    },
    workingHours: {
      type: Number, // in hours
      default: 0,
    },
    overtimeHours: {
      type: Number, // in hours
      default: 0,
    },
    breakDuration: {
      type: Number, // in minutes
      default: 0,
    },
    notes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes
attendanceSchema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ companyId: 1, date: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;

