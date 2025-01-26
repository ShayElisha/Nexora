// models/Signature.js
import mongoose from "mongoose";

const SignatureSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    name: { type: String, required: true },
    requiredSignatures: { type: Number, required: true }, // מספר חתימות נדרשות

    signers: [
      {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employees" ,required: true },
        name: { type: String, required: true }, // שם החותם
        role: { type: String, required: true }, // תפקיד
        order: { type: Number, required: true }, // סדר החתימה
      },
    ],
  },
  { timestamps: true }
);

const Signature = mongoose.model("Signature", SignatureSchema);

export default Signature;
