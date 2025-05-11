import mongoose from "mongoose";
const sickDaysSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  accrual_rate: {
    type: String,
    required: true,
    trim: true,
  },
  max_accrual: {
    type: String,
    required: true,
    trim: true,
  },
  carry_over: {
    type: String,
    required: true,
    trim: true,
  },
  waiting_period: {
    type: String,
    required: true,
    trim: true,
  },
  paid_percentage: {
    type: String,
    required: true,
    trim: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const SickDays = mongoose.model("SickDays", sickDaysSchema);

export default SickDays;
