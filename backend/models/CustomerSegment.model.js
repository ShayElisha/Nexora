import mongoose from "mongoose";

const CustomerSegmentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    criteria: {
      // Criteria for segmenting customers
      customerType: {
        type: String,
        enum: ["Individual", "Corporate", "All"],
      },
      status: {
        type: [String],
        enum: ["Active", "Inactive", "Prospect"],
      },
      industry: {
        type: [String],
      },
      minOrderValue: {
        type: Number,
        default: 0,
      },
      maxOrderValue: {
        type: Number,
      },
      minOrderCount: {
        type: Number,
        default: 0,
      },
      lastOrderDays: {
        type: Number, // Customers who ordered in last X days
      },
      location: {
        type: [String],
      },
    },
    customerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    ],
    campaignIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],
    color: {
      type: String,
      default: "#3B82F6",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CustomerSegmentSchema.index({ companyId: 1, isActive: 1 });
CustomerSegmentSchema.index({ companyId: 1, name: 1 });

const CustomerSegment = mongoose.models.CustomerSegment || mongoose.model("CustomerSegment", CustomerSegmentSchema);
export default CustomerSegment;

