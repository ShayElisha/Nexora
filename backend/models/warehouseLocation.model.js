import mongoose from "mongoose";

const warehouseLocationSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
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
    zone: {
      type: String,
      trim: true,
    },
    aisle: {
      type: String,
      trim: true,
    },
    shelf: {
      type: String,
      trim: true,
    },
    binCode: {
      type: String,
      trim: true,
    },
    temperatureControlled: {
      type: Boolean,
      default: false,
    },
    capacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentUtilization: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

warehouseLocationSchema.index(
  { companyId: 1, warehouseId: 1, name: 1 },
  { unique: true }
);

const WarehouseLocation =
  mongoose.models.WarehouseLocation ||
  mongoose.model("WarehouseLocation", warehouseLocationSchema);

export default WarehouseLocation;

