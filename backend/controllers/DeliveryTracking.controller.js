import DeliveryTracking from "../models/DeliveryTracking.model.js";
import Procurement from "../models/procurement.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import jwt from "jsonwebtoken";
import { uploadToCloudinaryFile } from "../config/lib/cloudinary.js";

/**
 * Generate unique tracking number
 */
const generateTrackingNumber = () => {
  const prefix = "TRK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Create delivery tracking
 */
export const createTracking = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;
    const employeeId = decodedToken.employeeId || decodedToken.userId;

    const {
      orderId,
      orderType,
      shippingCompany,
      carrier,
      estimatedDeliveryDate,
      deliveryAddress,
    } = req.body;

    if (!orderId || !orderType || !shippingCompany) {
      return res.status(400).json({
        success: false,
        message: "orderId, orderType, and shippingCompany are required",
      });
    }

    // Verify order exists
    let order;
    if (orderType === "procurement") {
      order = await Procurement.findById(orderId);
    } else if (orderType === "customer") {
      order = await CustomerOrder.findById(orderId);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid orderType. Must be 'procurement' or 'customer'",
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const orderModel =
      orderType === "procurement" ? "Procurement" : "CustomerOrder";

    const resolvedDeliveryAddress =
      (deliveryAddress && Object.keys(deliveryAddress).length > 0
        ? deliveryAddress
        : order?.shippingAddress || {}) || {};

    // Generate tracking number
    const trackingNumber = generateTrackingNumber();

    // Create tracking record
    const tracking = new DeliveryTracking({
      orderId,
      orderType,
      orderModel,
      companyId,
      trackingNumber,
      shippingCompany,
      carrier: carrier || "Other",
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
      deliveryAddress: resolvedDeliveryAddress,
      shippingStatus: "Preparing",
      trackingHistory: [
        {
          status: "Preparing",
          location: "",
          timestamp: new Date(),
          notes: "Tracking created",
          updatedBy: employeeId,
        },
      ],
      createdBy: employeeId,
    });

    // Generate QR code (optional - if qrcode package is installed)
    try {
      const trackingUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/track/${trackingNumber}`;
      const QRCode = (await import("qrcode")).default;
      const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl);
      const qrCodeUpload = await uploadToCloudinaryFile(qrCodeDataUrl);
      tracking.qrCode = qrCodeUpload.secure_url;
    } catch (error) {
      console.warn("QR Code generation failed (qrcode package may not be installed):", error.message);
      // Continue without QR code - it's optional
      tracking.qrCode = null;
    }

    await tracking.save();

    // Update order with tracking ID
    order.deliveryTrackingId = tracking._id;
    if (orderType === "procurement") {
      order.orderStatus = "In Progress";
    } else if (orderType === "customer") {
      // כשנוצר מעקב משלוח = נשלח לחברת שליחויות
      order.status = "Shipped";
      order.shippedAt = new Date();
      // עדכן גם את preparationStatus אם עדיין לא
      if (!order.preparationStatus || order.preparationStatus === "Not Started") {
        order.preparationStatus = "Ready to Ship";
      }
    }
    await order.save();

    res.status(201).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error creating tracking:", error);
    res.status(500).json({
      success: false,
      message: "Error creating tracking",
      error: error.message,
    });
  }
};

/**
 * Get tracking by order
 */
export const getTrackingByOrder = async (req, res) => {
  try {
    const { orderId, orderType } = req.params;

    if (!orderId || !orderType) {
      return res.status(400).json({
        success: false,
        message: "orderId and orderType are required",
      });
    }

    const tracking = await DeliveryTracking.findOne({
      orderId,
      orderType,
    })
      .populate("createdBy", "name email")
      .populate("trackingHistory.updatedBy", "name email");

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error getting tracking:", error);
    res.status(500).json({
      success: false,
      message: "Error getting tracking",
      error: error.message,
    });
  }
};

/**
 * Get all trackings
 */
export const getAllTrackings = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { status, carrier, orderType } = req.query;

    let query = { companyId };

    if (status) {
      query.shippingStatus = status;
    }

    if (carrier) {
      query.carrier = carrier;
    }

    if (orderType) {
      query.orderType = orderType;
    }

    const trackings = await DeliveryTracking.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .limit(100);

    res.status(200).json({
      success: true,
      data: trackings,
    });
  } catch (error) {
    console.error("Error getting trackings:", error);
    res.status(500).json({
      success: false,
      message: "Error getting trackings",
      error: error.message,
    });
  }
};

/**
 * Update tracking status
 */
export const updateTrackingStatus = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decodedToken.employeeId || decodedToken.userId;

    const { id } = req.params;
    const { status, location, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const tracking = await DeliveryTracking.findById(id);
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    // Add to history
    tracking.trackingHistory.push({
      status,
      location: location || tracking.currentLocation || "",
      timestamp: new Date(),
      notes: notes || "",
      updatedBy: employeeId,
    });

    // Update current status and location
    tracking.shippingStatus = status;
    if (location) {
      tracking.currentLocation = location;
    }

    // Update order status based on shipping status
    if (tracking.orderType === "customer") {
      const customerOrder = await CustomerOrder.findById(tracking.orderId);
      if (customerOrder) {
        // Update order status based on shipping status
        // כשהמשלוח "נשלח" (In Transit) או "בדרך למסירה" - הסטטוס נשאר "Shipped" (נשלח לחברת שליחויות)
        // כשהמשלוח "נמסר" - עדכן ל-"Delivered"
        if (status === "Delivered") {
          customerOrder.status = "Delivered";
          customerOrder.deliveredAt = new Date();
          tracking.actualDeliveryDate = new Date();
        } else if (status === "Exception" || status === "Returned") {
          // אם יש בעיה - העבר ל-"On Hold"
          if (customerOrder.status === "Shipped") {
            customerOrder.status = "On Hold";
          }
        }
        // In Transit ו-Out for Delivery לא משנים את status של ההזמנה (נשאר Shipped)
        await customerOrder.save();
      }
    } else if (tracking.orderType === "procurement") {
      const procurement = await Procurement.findById(tracking.orderId);
      if (procurement) {
        if (status === "Delivered") {
          procurement.orderStatus = "Delivered";
          procurement.receivedDate = new Date();
          tracking.actualDeliveryDate = new Date();
          await procurement.save();
        }
      }
    }

    await tracking.save();

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error updating tracking status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating tracking status",
      error: error.message,
    });
  }
};

/**
 * Add tracking update
 */
export const addTrackingUpdate = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decodedToken.employeeId || decodedToken.userId;

    const { id } = req.params;
    const { status, location, notes } = req.body;

    const tracking = await DeliveryTracking.findById(id);
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    tracking.trackingHistory.push({
      status: status || tracking.shippingStatus,
      location: location || "",
      timestamp: new Date(),
      notes: notes || "",
      updatedBy: employeeId,
    });

    if (location) {
      tracking.currentLocation = location;
    }

    await tracking.save();

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error adding tracking update:", error);
    res.status(500).json({
      success: false,
      message: "Error adding tracking update",
      error: error.message,
    });
  }
};

/**
 * Mark as delivered
 */
export const markAsDelivered = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decodedToken.employeeId || decodedToken.userId;

    const { id } = req.params;
    const { signature, proof, notes } = req.body;

    const tracking = await DeliveryTracking.findById(id);
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    // Upload signature if provided
    if (signature) {
      const signatureUpload = await uploadToCloudinaryFile(signature, "delivery-signatures");
      tracking.signatureUrl = signatureUpload.secure_url;
    }

    // Upload proof if provided
    if (proof) {
      const proofUpload = await uploadToCloudinaryFile(proof, "delivery-proofs");
      tracking.deliveryProof = proofUpload.secure_url;
    }

    tracking.shippingStatus = "Delivered";
    tracking.actualDeliveryDate = new Date();
    if (notes) {
      tracking.deliveryNotes = notes;
    }

    tracking.trackingHistory.push({
      status: "Delivered",
      location: tracking.currentLocation || "",
      timestamp: new Date(),
      notes: notes || "Marked as delivered",
      updatedBy: employeeId,
    });

    await tracking.save();

    // Update order status
    if (tracking.orderType === "procurement") {
      const procurement = await Procurement.findById(tracking.orderId);
      if (procurement) {
        procurement.orderStatus = "Delivered";
        procurement.receivedDate = new Date();
        await procurement.save();
      }
    } else if (tracking.orderType === "customer") {
      const customerOrder = await CustomerOrder.findById(tracking.orderId);
      if (customerOrder) {
        customerOrder.status = "Delivered";
        customerOrder.deliveredAt = new Date();
        await customerOrder.save();
      }
    }

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error marking as delivered:", error);
    res.status(500).json({
      success: false,
      message: "Error marking as delivered",
      error: error.message,
    });
  }
};

/**
 * Upload delivery proof
 */
export const uploadDeliveryProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const tracking = await DeliveryTracking.findById(id);
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    const proofUpload = await uploadToCloudinaryFile(image, "delivery-proofs");
    tracking.deliveryProof = proofUpload.secure_url;

    await tracking.save();

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error uploading delivery proof:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading delivery proof",
      error: error.message,
    });
  }
};

/**
 * Get tracking by tracking number (public)
 */
export const getTrackingByNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const tracking = await DeliveryTracking.findOne({ trackingNumber })
      .populate("orderId")
      .select("-createdBy -trackingHistory.updatedBy");

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error getting tracking:", error);
    res.status(500).json({
      success: false,
      message: "Error getting tracking",
      error: error.message,
    });
  }
};

/**
 * Get tracking by ID
 */
export const getTrackingById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;

    const tracking = await DeliveryTracking.findById(id)
      .populate("createdBy", "name email")
      .populate("trackingHistory.updatedBy", "name email");

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    // Verify company access
    if (tracking.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error getting tracking:", error);
    res.status(500).json({
      success: false,
      message: "Error getting tracking",
      error: error.message,
    });
  }
};

