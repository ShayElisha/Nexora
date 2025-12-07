import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Customer from "../models/customers.model.js";
import CustomerOrder from "../models/CustomerOrder.model.js";
import Invoice from "../models/Invoice.model.js";
import Payment from "../models/Payment.model.js";
import Activity from "../models/Activity.model.js";
import Task from "../models/tasks.model.js";
import Project from "../models/project.model.js";
import Lead from "../models/Lead.model.js";
import SupportTicket from "../models/supportTicket.model.js";
import CustomerSegment from "../models/CustomerSegment.model.js";
import CustomerSatisfaction from "../models/CustomerSatisfaction.model.js";
import CustomerRetention from "../models/CustomerRetention.model.js";
import CustomerFile from "../models/CustomerFile.model.js";

// Helper function to verify token and get companyId
const verifyToken = (req) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    throw new Error("Unauthorized");
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    throw new Error("Invalid token");
  }
  return decodedToken;
};

// ==================== CUSTOMER 360 ====================

/**
 * Get Customer 360 View - All customer information in one place
 */
export const getCustomer360 = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    // Get customer basic info
    const customer = await Customer.findOne({ _id: customerId, companyId })
      .populate("createdBy", "name lastName")
      .populate("updatedBy", "name lastName");

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Get all orders
    const orders = await CustomerOrder.find({ customer: customerId, companyId })
      .populate("items.product", "name")
      .sort({ orderDate: -1 })
      .limit(50);

    // Get all invoices
    const invoices = await Invoice.find({ customerId: customerId, companyId })
      .sort({ invoiceDate: -1 })
      .limit(50);

    // Get all payments
    const payments = await Payment.find({ companyId })
      .populate({
        path: "invoiceId",
        match: { customerId: customerId },
      })
      .sort({ paymentDate: -1 })
      .limit(50);

    // Filter out payments without matching invoice
    const customerPayments = payments.filter((p) => p.invoiceId);

    // Get all activities/interactions
    const activities = await Activity.find({
      companyId,
      "relatedTo.customerId": customerId,
    })
      .populate("createdBy", "name lastName")
      .sort({ date: -1 })
      .limit(50);

    // Get all tasks related to customer
    const tasks = await Task.find({
      companyId,
      relatedTo: "Customer",
      relatedId: customerId,
    })
      .populate("assignedTo", "name lastName")
      .sort({ dueDate: -1 })
      .limit(50);

    // Get all projects related to customer
    const projects = await Project.find({
      companyId,
      customerId: customerId,
    })
      .populate("projectManager", "name lastName")
      .sort({ createdAt: -1 })
      .limit(50);

    // Get all leads related to customer
    const leads = await Lead.find({
      companyId,
      customerId: customerId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get all support tickets
    const supportTickets = await SupportTicket.find({
      companyId,
      customerId: customerId,
    })
      .populate("assignedTo", "name lastName")
      .sort({ createdAt: -1 })
      .limit(50);

    // Get all files
    const files = await CustomerFile.find({ customerId, companyId })
      .populate("uploadedBy", "name lastName")
      .sort({ createdAt: -1 });

    // Get satisfaction surveys
    const satisfactionSurveys = await CustomerSatisfaction.find({
      customerId,
      companyId,
    })
      .sort({ responseDate: -1 })
      .limit(10);

    // Get retention data
    const retentionData = await CustomerRetention.findOne({
      customerId,
      companyId,
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalInvoices = invoices.length;
    const totalInvoiceValue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingInvoices = invoices.filter((inv) => inv.status !== "Paid").length;
    const averageOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;

    // Get last order date
    const lastOrder = orders[0] || null;
    const daysSinceLastOrder = lastOrder
      ? Math.floor((Date.now() - new Date(lastOrder.orderDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    res.status(200).json({
      success: true,
      data: {
        customer,
        orders,
        invoices,
        payments: customerPayments,
        activities,
        tasks,
        projects,
        leads,
        supportTickets,
        files,
        satisfactionSurveys,
        retentionData,
        statistics: {
          totalOrders,
          totalOrderValue,
          totalInvoices,
          totalInvoiceValue,
          totalPaid,
          pendingInvoices,
          averageOrderValue,
          lastOrderDate: lastOrder?.orderDate || null,
          daysSinceLastOrder,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching customer 360:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer 360 view",
      error: error.message,
    });
  }
};

// ==================== CUSTOMER SEGMENTATION ====================

/**
 * Get all customer segments
 */
export const getCustomerSegments = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const segments = await CustomerSegment.find({ companyId, isActive: true })
      .populate("customerIds", "name email")
      .sort({ createdAt: -1 });

    // Calculate customer counts for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment) => {
        const count = segment.customerIds?.length || 0;
        return {
          ...segment.toObject(),
          customerCount: count,
        };
      })
    );

    res.status(200).json({ success: true, data: segmentsWithCounts });
  } catch (error) {
    console.error("Error fetching customer segments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer segments",
      error: error.message,
    });
  }
};

/**
 * Create a new customer segment
 */
export const createCustomerSegment = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const { name, description, criteria, color } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Segment name is required" });
    }

    // Build query based on criteria
    const query = { companyId };
    if (criteria.customerType && criteria.customerType !== "All") {
      query.customerType = criteria.customerType;
    }
    if (criteria.status && criteria.status.length > 0) {
      query.status = { $in: criteria.status };
    }
    if (criteria.industry && criteria.industry.length > 0) {
      query.industry = { $in: criteria.industry };
    }

    // Find customers matching criteria
    const matchingCustomers = await Customer.find(query).select("_id");

    const segment = new CustomerSegment({
      companyId,
      name,
      description,
      criteria,
      customerIds: matchingCustomers.map((c) => c._id),
      color: color || "#3B82F6",
      isActive: true,
    });

    await segment.save();

    res.status(201).json({ success: true, data: segment });
  } catch (error) {
    console.error("Error creating customer segment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create customer segment",
      error: error.message,
    });
  }
};

/**
 * Update customer segment
 */
export const updateCustomerSegment = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { id } = req.params;

    const segment = await CustomerSegment.findOne({ _id: id, companyId });
    if (!segment) {
      return res.status(404).json({ success: false, message: "Segment not found" });
    }

    const { name, description, criteria, color, isActive } = req.body;

    if (name) segment.name = name;
    if (description !== undefined) segment.description = description;
    if (criteria) {
      segment.criteria = criteria;
      // Recalculate matching customers
      const query = { companyId };
      if (criteria.customerType && criteria.customerType !== "All") {
        query.customerType = criteria.customerType;
      }
      if (criteria.status && criteria.status.length > 0) {
        query.status = { $in: criteria.status };
      }
      if (criteria.industry && criteria.industry.length > 0) {
        query.industry = { $in: criteria.industry };
      }
      const matchingCustomers = await Customer.find(query).select("_id");
      segment.customerIds = matchingCustomers.map((c) => c._id);
    }
    if (color) segment.color = color;
    if (isActive !== undefined) segment.isActive = isActive;

    await segment.save();

    res.status(200).json({ success: true, data: segment });
  } catch (error) {
    console.error("Error updating customer segment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update customer segment",
      error: error.message,
    });
  }
};

/**
 * Delete customer segment
 */
export const deleteCustomerSegment = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const { id } = req.params;

    const segment = await CustomerSegment.findOneAndDelete({ _id: id, companyId });
    if (!segment) {
      return res.status(404).json({ success: false, message: "Segment not found" });
    }

    res.status(200).json({ success: true, message: "Segment deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer segment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete customer segment",
      error: error.message,
    });
  }
};

/**
 * Get segmentation analytics
 */
export const getSegmentationAnalytics = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const segments = await CustomerSegment.find({ companyId, isActive: true });
    const totalCustomers = await Customer.countDocuments({ companyId });

    const analytics = await Promise.all(
      segments.map(async (segment) => {
        const customerCount = segment.customerIds?.length || 0;
        const percentage = totalCustomers > 0 ? (customerCount / totalCustomers) * 100 : 0;

        // Calculate segment value (sum of orders)
        const segmentOrders = await CustomerOrder.find({
          companyId,
          customer: { $in: segment.customerIds },
        });
        const segmentValue = segmentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        return {
          segmentId: segment._id,
          segmentName: segment.name,
          customerCount,
          percentage: percentage.toFixed(2),
          segmentValue,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        segments: analytics,
        totalCustomers,
      },
    });
  } catch (error) {
    console.error("Error fetching segmentation analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch segmentation analytics",
      error: error.message,
    });
  }
};

// ==================== CUSTOMER SATISFACTION ====================

/**
 * Get all satisfaction surveys
 */
export const getCustomerSatisfaction = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const { customerId, surveyType, status } = req.query;

    const query = { companyId };
    if (customerId) query.customerId = customerId;
    if (surveyType) query.surveyType = surveyType;
    if (status) query.status = status;

    const surveys = await CustomerSatisfaction.find(query)
      .populate("customerId", "name email")
      .sort({ responseDate: -1 });

    res.status(200).json({ success: true, data: surveys });
  } catch (error) {
    console.error("Error fetching customer satisfaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer satisfaction",
      error: error.message,
    });
  }
};

/**
 * Create satisfaction survey
 */
export const createCustomerSatisfaction = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const {
      customerId,
      surveyType,
      satisfactionScore,
      npsScore,
      questions,
      feedback,
      wouldRecommend,
      relatedTo,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "Customer ID is required" });
    }

    // Calculate NPS category if NPS score provided
    let npsCategory = null;
    if (npsScore !== undefined && npsScore !== null) {
      if (npsScore >= 9) npsCategory = "Promoter";
      else if (npsScore >= 7) npsCategory = "Passive";
      else npsCategory = "Detractor";
    }

    const survey = new CustomerSatisfaction({
      companyId,
      customerId,
      surveyType: surveyType || "Satisfaction",
      satisfactionScore,
      npsScore,
      npsCategory,
      questions,
      feedback,
      wouldRecommend,
      relatedTo,
      status: "Responded",
      responseDate: new Date(),
      sentDate: new Date(),
    });

    await survey.save();

    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    console.error("Error creating customer satisfaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create customer satisfaction survey",
      error: error.message,
    });
  }
};

/**
 * Get satisfaction analytics
 */
export const getSatisfactionAnalytics = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const surveys = await CustomerSatisfaction.find({ companyId, status: "Responded" });

    // Calculate average satisfaction
    const satisfactionScores = surveys
      .filter((s) => s.satisfactionScore)
      .map((s) => s.satisfactionScore);
    const avgSatisfaction =
      satisfactionScores.length > 0
        ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
        : 0;

    // Calculate NPS
    const npsScores = surveys.filter((s) => s.npsScore !== undefined && s.npsScore !== null);
    const promoters = npsScores.filter((s) => s.npsCategory === "Promoter").length;
    const detractors = npsScores.filter((s) => s.npsCategory === "Detractor").length;
    const totalNPS = npsScores.length;
    const nps = totalNPS > 0 ? ((promoters - detractors) / totalNPS) * 100 : 0;

    // Category distribution
    const categoryDistribution = {
      Promoter: npsScores.filter((s) => s.npsCategory === "Promoter").length,
      Passive: npsScores.filter((s) => s.npsCategory === "Passive").length,
      Detractor: npsScores.filter((s) => s.npsCategory === "Detractor").length,
    };

    res.status(200).json({
      success: true,
      data: {
        averageSatisfaction: avgSatisfaction.toFixed(2),
        nps: nps.toFixed(2),
        totalSurveys: surveys.length,
        categoryDistribution,
        responseRate: surveys.length > 0 ? (surveys.filter((s) => s.status === "Responded").length / surveys.length) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching satisfaction analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch satisfaction analytics",
      error: error.message,
    });
  }
};

// ==================== CUSTOMER RETENTION ====================

/**
 * Get all customer retention data
 */
export const getCustomerRetention = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const { riskLevel, status } = req.query;

    const query = { companyId };
    if (riskLevel) query.riskLevel = riskLevel;
    if (status) query.status = status;

    const retentionData = await CustomerRetention.find(query)
      .populate("customerId", "name email phone")
      .sort({ riskScore: -1 });

    res.status(200).json({ success: true, data: retentionData });
  } catch (error) {
    console.error("Error fetching customer retention:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer retention",
      error: error.message,
    });
  }
};

/**
 * Calculate retention risk for all customers
 */
export const calculateRetentionRisk = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const customers = await Customer.find({ companyId, status: "Active" });

    for (const customer of customers) {
      // Get last order
      const lastOrder = await CustomerOrder.findOne({
        customer: customer._id,
        companyId,
      })
        .sort({ orderDate: -1 })
        .limit(1);

      // Get all orders
      const orders = await CustomerOrder.find({
        customer: customer._id,
        companyId,
      }).sort({ orderDate: -1 });

      // Calculate risk factors
      const riskFactors = [];
      let riskScore = 0;

      // No orders
      if (orders.length === 0) {
        riskFactors.push({
          factor: "NoOrders",
          severity: "High",
          description: "Customer has no orders",
          detectedDate: new Date(),
        });
        riskScore += 30;
      } else {
        // Days since last order
        const daysSinceLastOrder = lastOrder
          ? Math.floor((Date.now() - new Date(lastOrder.orderDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceLastOrder > 90) {
          riskFactors.push({
            factor: "NoActivity",
            severity: "High",
            description: `No orders in ${daysSinceLastOrder} days`,
            detectedDate: new Date(),
          });
          riskScore += 25;
        } else if (daysSinceLastOrder > 60) {
          riskFactors.push({
            factor: "NoActivity",
            severity: "Medium",
            description: `No orders in ${daysSinceLastOrder} days`,
            detectedDate: new Date(),
          });
          riskScore += 15;
        }

        // Decreasing orders
        if (orders.length >= 3) {
          const recentOrders = orders.slice(0, 3);
          const olderOrders = orders.slice(3, 6);
          if (olderOrders.length > 0) {
            const recentAvg = recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / recentOrders.length;
            const olderAvg = olderOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / olderOrders.length;
            if (recentAvg < olderAvg * 0.7) {
              riskFactors.push({
                factor: "DecreasingOrders",
                severity: "Medium",
                description: "Order value decreasing",
                detectedDate: new Date(),
              });
              riskScore += 20;
            }
          }
        }
      }

      // Check for negative feedback
      const negativeSurveys = await CustomerSatisfaction.find({
        companyId,
        customerId: customer._id,
        satisfactionScore: { $lt: 3 },
      });
      if (negativeSurveys.length > 0) {
        riskFactors.push({
          factor: "NegativeFeedback",
          severity: "High",
          description: "Negative satisfaction feedback",
          detectedDate: new Date(),
        });
        riskScore += 25;
      }

      // Determine risk level
      let riskLevel = "Low";
      if (riskScore >= 60) riskLevel = "Critical";
      else if (riskScore >= 40) riskLevel = "High";
      else if (riskScore >= 20) riskLevel = "Medium";

      // Update or create retention record
      await CustomerRetention.findOneAndUpdate(
        { customerId: customer._id, companyId },
        {
          companyId,
          customerId: customer._id,
          riskLevel,
          riskScore: Math.min(riskScore, 100),
          riskFactors,
          lastOrderDate: lastOrder?.orderDate || null,
          daysSinceLastOrder: lastOrder
            ? Math.floor((Date.now() - new Date(lastOrder.orderDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999,
          orderTrend: orders.length >= 2 ? "Stable" : "None",
          status: riskLevel === "Critical" || riskLevel === "High" ? "AtRisk" : "Active",
          lastCalculated: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Retention risk calculated for all customers",
    });
  } catch (error) {
    console.error("Error calculating retention risk:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate retention risk",
      error: error.message,
    });
  }
};

/**
 * Get retention analytics
 */
export const getRetentionAnalytics = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);

    const retentionData = await CustomerRetention.find({ companyId });

    const riskDistribution = {
      Low: retentionData.filter((r) => r.riskLevel === "Low").length,
      Medium: retentionData.filter((r) => r.riskLevel === "Medium").length,
      High: retentionData.filter((r) => r.riskLevel === "High").length,
      Critical: retentionData.filter((r) => r.riskLevel === "Critical").length,
    };

    const statusDistribution = {
      Active: retentionData.filter((r) => r.status === "Active").length,
      AtRisk: retentionData.filter((r) => r.status === "AtRisk").length,
      Retained: retentionData.filter((r) => r.status === "Retained").length,
      Lost: retentionData.filter((r) => r.status === "Lost").length,
    };

    const avgRiskScore =
      retentionData.length > 0
        ? retentionData.reduce((sum, r) => sum + (r.riskScore || 0), 0) / retentionData.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        riskDistribution,
        statusDistribution,
        averageRiskScore: avgRiskScore.toFixed(2),
        totalCustomers: retentionData.length,
        atRiskCustomers: statusDistribution.AtRisk,
      },
    });
  } catch (error) {
    console.error("Error fetching retention analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch retention analytics",
      error: error.message,
    });
  }
};

/**
 * Add retention action
 */
export const addRetentionAction = async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const companyId = new mongoose.Types.ObjectId(decoded.companyId);
    const employeeId = decoded.employeeId;
    const { customerId, actionType, description, result } = req.body;

    if (!customerId || !actionType) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and action type are required",
      });
    }

    const retention = await CustomerRetention.findOne({ customerId, companyId });
    if (!retention) {
      return res.status(404).json({ success: false, message: "Retention record not found" });
    }

    retention.retentionActions.push({
      actionType,
      description,
      performedBy: employeeId,
      result: result || "Pending",
      date: new Date(),
    });

    await retention.save();

    res.status(200).json({ success: true, data: retention });
  } catch (error) {
    console.error("Error adding retention action:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add retention action",
      error: error.message,
    });
  }
};

