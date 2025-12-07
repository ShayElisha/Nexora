import mongoose from "mongoose";

const PendingUpdateSchema = new mongoose.Schema({
  ProcurementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Procurement",
    required: true,
  },
  updatedData: { type: Object, required: true },
  status: {
    type: String,
    enum: ["pending update", "approved", "rejected"],
    default: "pending update",
  },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  createdAt: { type: Date, default: Date.now },
});

// Create the model from the schema
const PendingUpdate = mongoose.model("PendingUpdate", PendingUpdateSchema);

// Export the model
export default PendingUpdate;
