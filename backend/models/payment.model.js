import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true }, // Checkout session ID (not unique for recurring payments)
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  }, // Company identifier
  amount: { type: Number, required: true }, // Payment amount
  currency: { type: String, required: true }, // Currency of the payment
  planName: { type: String }, // Name of the subscription plan (optional)
  paymentDate: { type: Date, default: Date.now }, // Date of payment
  startDate: { type: Date, required: true }, // Start date of the subscription period
  endDate: { type: Date, required: true }, // End date of the subscription period
  refunded: { type: Boolean, default: false },
  invoiceId: { type: String }, // Stripe invoice ID
  subscriptionId: { type: String }, // Stripe subscription ID
  paymentIntentId: { type: String }, // Stripe payment intent ID
  isRecurring: { type: Boolean, default: false }, // Whether this is a recurring payment
  periodNumber: { type: Number, default: 1 }, // Period number (1 = first payment, 2 = first renewal, etc.)
  paymentStatus: { 
    type: String, 
    enum: ["succeeded", "pending", "failed", "refunded"],
    default: "succeeded"
  }, // Payment status from Stripe
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Index for faster queries
paymentSchema.index({ companyId: 1, paymentDate: -1 });
paymentSchema.index({ subscriptionId: 1 });
paymentSchema.index({ invoiceId: 1 });

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
