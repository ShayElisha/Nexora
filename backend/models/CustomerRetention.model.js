import mongoose from "mongoose";

const CustomerRetentionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    // Risk Level
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    // Risk Score (0-100)
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Risk Factors
    riskFactors: [
      {
        factor: {
          type: String,
          enum: [
            "NoOrders",
            "DecreasingOrders",
            "LatePayments",
            "NegativeFeedback",
            "NoActivity",
            "SupportIssues",
            "CompetitorSwitch",
          ],
        },
        severity: {
          type: String,
          enum: ["Low", "Medium", "High"],
        },
        description: {
          type: String,
        },
        detectedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Last order date
    lastOrderDate: {
      type: Date,
    },
    // Days since last order
    daysSinceLastOrder: {
      type: Number,
      default: 0,
    },
    // Order frequency trend (increasing/decreasing/stable)
    orderTrend: {
      type: String,
      enum: ["Increasing", "Decreasing", "Stable", "None"],
      default: "None",
    },
    // Retention actions taken
    retentionActions: [
      {
        actionType: {
          type: String,
          enum: ["Email", "Call", "Discount", "SpecialOffer", "PersonalContact", "Survey"],
        },
        description: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        result: {
          type: String,
          enum: ["Success", "Pending", "Failed", "NoResponse"],
        },
      },
    ],
    // Campaign IDs for retention campaigns
    campaignIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    // Status
    status: {
      type: String,
      enum: ["Active", "Retained", "Lost", "AtRisk"],
      default: "Active",
    },
    // Last calculated date
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

CustomerRetentionSchema.index({ companyId: 1, customerId: 1 });
CustomerRetentionSchema.index({ companyId: 1, riskLevel: 1 });
CustomerRetentionSchema.index({ companyId: 1, riskScore: -1 });
CustomerRetentionSchema.index({ companyId: 1, status: 1 });
CustomerRetentionSchema.index({ companyId: 1, lastOrderDate: 1 });

const CustomerRetention = mongoose.models.CustomerRetention || mongoose.model("CustomerRetention", CustomerRetentionSchema);
export default CustomerRetention;

