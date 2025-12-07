import mongoose from "mongoose";

const CustomerSatisfactionSchema = new mongoose.Schema(
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
    surveyType: {
      type: String,
      enum: ["Satisfaction", "NPS", "CSAT", "Custom"],
      default: "Satisfaction",
    },
    // Satisfaction Score (1-5 or 1-10)
    satisfactionScore: {
      type: Number,
      min: 1,
      max: 10,
    },
    // NPS Score (-100 to 100)
    npsScore: {
      type: Number,
      min: -100,
      max: 100,
    },
    // NPS Category
    npsCategory: {
      type: String,
      enum: ["Promoter", "Passive", "Detractor"],
    },
    // Survey Questions and Answers
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: mongoose.Schema.Types.Mixed, // Can be String, Number, or Array
        },
        score: {
          type: Number,
          min: 1,
          max: 10,
        },
      },
    ],
    // Overall feedback
    feedback: {
      type: String,
      trim: true,
    },
    // Would recommend (for NPS)
    wouldRecommend: {
      type: Number,
      min: 0,
      max: 10,
    },
    // Response date
    responseDate: {
      type: Date,
      default: Date.now,
    },
    // Survey sent date
    sentDate: {
      type: Date,
    },
    // Status
    status: {
      type: String,
      enum: ["Sent", "Responded", "Reminded", "Expired"],
      default: "Sent",
    },
    // Related to order/invoice/interaction
    relatedTo: {
      type: {
        type: String,
        enum: ["Order", "Invoice", "Support", "Product", "General"],
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerOrder",
      },
      invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
      ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SupportTicket",
      },
    },
  },
  { timestamps: true }
);

CustomerSatisfactionSchema.index({ companyId: 1, customerId: 1 });
CustomerSatisfactionSchema.index({ companyId: 1, responseDate: -1 });
CustomerSatisfactionSchema.index({ companyId: 1, surveyType: 1 });
CustomerSatisfactionSchema.index({ companyId: 1, npsCategory: 1 });

const CustomerSatisfaction = mongoose.models.CustomerSatisfaction || mongoose.model("CustomerSatisfaction", CustomerSatisfactionSchema);
export default CustomerSatisfaction;

