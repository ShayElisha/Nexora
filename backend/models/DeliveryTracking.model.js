import mongoose from "mongoose";
import addressSchema from "./subschemas/address.schema.js";

const trackingHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: "",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
});

const deliveryTrackingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "orderModel",
      required: true,
      index: true,
    },
    orderType: {
      type: String,
      enum: ["procurement", "customer"],
      required: true,
    },
    orderModel: {
      type: String,
      enum: ["Procurement", "CustomerOrder"],
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    shippingCompany: {
      type: String,
      required: true,
    },
    carrier: {
      type: String,
      enum: [
        "DHL",
        "UPS",
        "FedEx",
        "USPS",
        "דואר ישראל",
        "TNT",
        "Aramex",
        "Other",
      ],
      default: "Other",
    },
    shippingStatus: {
      type: String,
      enum: [
        "Preparing",
        "Picked Up",
        "In Transit",
        "Out for Delivery",
        "Delivered",
        "Exception",
        "Returned",
      ],
      default: "Preparing",
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    trackingHistory: [trackingHistorySchema],
    currentLocation: {
      type: String,
      default: "",
    },
    deliveryAddress: addressSchema,
    deliveryNotes: {
      type: String,
      default: "",
    },
    signatureUrl: {
      type: String,
    },
    deliveryProof: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);

deliveryTrackingSchema.pre("validate", function (next) {
  if (this.orderType && !this.orderModel) {
    this.orderModel =
      this.orderType === "procurement" ? "Procurement" : "CustomerOrder";
  }

  if (!this.orderType && this.orderModel) {
    this.orderType =
      this.orderModel === "Procurement" ? "procurement" : "customer";
  }

  next();
});

// יצירת אינדקסים לשיפור ביצועים
deliveryTrackingSchema.index({ orderId: 1, orderModel: 1 });
deliveryTrackingSchema.index({ orderId: 1, orderType: 1 });
deliveryTrackingSchema.index({ trackingNumber: 1 });
deliveryTrackingSchema.index({ shippingStatus: 1 });
deliveryTrackingSchema.index({ companyId: 1 });

const DeliveryTracking =
  mongoose.models.DeliveryTracking ||
  mongoose.model("DeliveryTracking", deliveryTrackingSchema);

export default DeliveryTracking;

