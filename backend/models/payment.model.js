import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true }, // Ensure unique session ID
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  }, // Company identifier
  stripeCustomerId: { type: String, required: true }, // Stripe customer ID
  amount: { type: Number, required: true }, // Payment amount
  currency: { type: String, required: true }, // Currency of the payment
  planName: { type: String }, // Name of the subscription plan (optional)
  paymentDate: { type: Date, default: Date.now }, // Date of payment
  startDate: { type: Date, required: true }, // Start date of the subscription
  endDate: { type: Date, required: true }, // End date of the subscription
  refunded: { type: Boolean, default: false },
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
