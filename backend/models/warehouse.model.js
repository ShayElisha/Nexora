import mongoose from "mongoose";
import addressSchema from "./subschemas/address.schema.js";

const warehouseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["operational", "maintenance", "offline"],
      default: "operational",
      index: true,
    },
    automation: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    utilization: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    conditions: {
      temperature: { type: Number, default: 0 },
      humidity: { type: Number, default: 0 },
    },
    throughput: {
      inbound: { type: Number, default: 0 },
      outbound: { type: Number, default: 0 },
    },
    lastAudit: {
      type: Date,
    },
    alerts: [
      {
        code: { type: String },
        message: { type: String },
        severity: {
          type: String,
          enum: ["info", "warning", "critical"],
          default: "info",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    managers: [
      {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        name: { type: String },
      },
    ],
    address: addressSchema,
    metadata: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

warehouseSchema.index({ companyId: 1, name: 1 }, { unique: true });
warehouseSchema.index({ companyId: 1, code: 1 }, { unique: true, sparse: true });

const Warehouse =
  mongoose.models.Warehouse || mongoose.model("Warehouse", warehouseSchema);

export default Warehouse;

