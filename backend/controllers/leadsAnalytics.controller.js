import Lead from "../models/Lead.model.js";
import Activity from "../models/Activity.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Get conversion funnel
export const getConversionFunnel = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;

    const stages = [
      "New",
      "Contacted",
      "Qualified",
      "Proposal",
      "Negotiation",
      "Closed Won",
      "Closed Lost",
    ];

    const funnel = await Lead.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$estimatedValue" },
        },
      },
    ]);

    const result = stages.map((stage) => {
      const stageData = funnel.find((f) => f._id === stage);
      return {
        stage,
        count: stageData?.count || 0,
        totalValue: stageData?.totalValue || 0,
      };
    });

    // Calculate conversion rates
    const totalNew = result.find((r) => r.stage === "New")?.count || 0;
    const conversionRates = result.map((stage) => ({
      ...stage,
      conversionRate:
        totalNew > 0 ? ((stage.count / totalNew) * 100).toFixed(2) : 0,
    }));

    return res.status(200).json({ success: true, data: conversionRates });
  } catch (error) {
    console.error("Error fetching conversion funnel:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get pipeline velocity
export const getPipelineVelocity = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get leads that moved through stages
    const stageMovements = await Lead.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          ...(Object.keys(dateFilter).length > 0 && {
            updatedAt: dateFilter,
          }),
        },
      },
      {
        $project: {
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          estimatedValue: 1,
        },
      },
    ]);

    // Calculate average time in each stage
    const avgTimeInStage = {};
    stageMovements.forEach((lead) => {
      const timeInStage =
        (lead.updatedAt - lead.createdAt) / (1000 * 60 * 60 * 24); // days
      if (!avgTimeInStage[lead.status]) {
        avgTimeInStage[lead.status] = { total: 0, count: 0 };
      }
      avgTimeInStage[lead.status].total += timeInStage;
      avgTimeInStage[lead.status].count += 1;
    });

    const result = Object.keys(avgTimeInStage).map((stage) => ({
      stage,
      avgDays:
        avgTimeInStage[stage].count > 0
          ? (
              avgTimeInStage[stage].total / avgTimeInStage[stage].count
            ).toFixed(2)
          : 0,
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching pipeline velocity:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get revenue forecast
export const getRevenueForecast = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;

    const forecast = await Lead.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: { $nin: ["Closed Won", "Closed Lost"] },
        },
      },
      {
        $project: {
          estimatedValue: 1,
          probability: 1,
          expectedCloseDate: 1,
          status: 1,
          weightedValue: {
            $multiply: ["$estimatedValue", { $divide: ["$probability", 100] }],
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$expectedCloseDate" },
            month: { $month: "$expectedCloseDate" },
          },
          totalValue: { $sum: "$estimatedValue" },
          weightedValue: { $sum: "$weightedValue" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return res.status(200).json({ success: true, data: forecast });
  } catch (error) {
    console.error("Error fetching revenue forecast:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get source performance
export const getSourcePerformance = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;

    const sourceStats = await Lead.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: "$source",
          totalLeads: { $sum: 1 },
          wonLeads: {
            $sum: { $cond: [{ $eq: ["$status", "Closed Won"] }, 1, 0] },
          },
          lostLeads: {
            $sum: { $cond: [{ $eq: ["$status", "Closed Lost"] }, 1, 0] },
          },
          totalValue: { $sum: "$estimatedValue" },
          avgValue: { $avg: "$estimatedValue" },
        },
      },
      {
        $project: {
          source: "$_id",
          totalLeads: 1,
          wonLeads: 1,
          lostLeads: 1,
          totalValue: 1,
          avgValue: { $round: ["$avgValue", 2] },
          conversionRate: {
            $cond: [
              { $gt: ["$totalLeads", 0] },
              {
                $multiply: [
                  { $divide: ["$wonLeads", "$totalLeads"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalLeads: -1 } },
    ]);

    return res.status(200).json({ success: true, data: sourceStats });
  } catch (error) {
    console.error("Error fetching source performance:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get win/loss analysis
export const getWinLossAnalysis = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;

    const analysis = await Lead.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: { $in: ["Closed Won", "Closed Lost"] },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$estimatedValue" },
          avgValue: { $avg: "$estimatedValue" },
          avgProbability: { $avg: "$probability" },
        },
      },
    ]);

    const wonData = analysis.find((a) => a._id === "Closed Won");
    const lostData = analysis.find((a) => a._id === "Closed Lost");

    const result = {
      won: {
        count: wonData?.count || 0,
        totalValue: wonData?.totalValue || 0,
        avgValue: wonData?.avgValue || 0,
      },
      lost: {
        count: lostData?.count || 0,
        totalValue: lostData?.totalValue || 0,
        avgValue: lostData?.avgValue || 0,
      },
      winRate:
        (wonData?.count || 0) + (lostData?.count || 0) > 0
          ? (
              ((wonData?.count || 0) /
                ((wonData?.count || 0) + (lostData?.count || 0))) *
              100
            ).toFixed(2)
          : 0,
    };

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching win/loss analysis:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

