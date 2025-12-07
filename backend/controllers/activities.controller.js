import Activity from "../models/Activity.model.js";
import Lead from "../models/Lead.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Create a new activity
export const createActivity = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employeeId = decodedToken?.employeeId;
    const companyId = decodedToken?.companyId;

    const {
      type,
      subject,
      description,
      relatedTo,
      date,
      duration,
      outcome,
      nextAction,
      nextFollowUp,
      attachments,
      details,
    } = req.body;

    if (!type || !subject || !relatedTo) {
      return res.status(400).json({
        success: false,
        message: "Type, subject, and relatedTo are required",
      });
    }

    // Convert companyId to ObjectId if needed
    let finalCompanyId = companyId;
    if (typeof companyId === "string" && mongoose.Types.ObjectId.isValid(companyId)) {
      finalCompanyId = new mongoose.Types.ObjectId(companyId);
    }

    const newActivity = new Activity({
      companyId: finalCompanyId,
      type,
      subject,
      description,
      relatedTo,
      date: date || new Date(),
      duration: duration || 0,
      outcome,
      nextAction,
      nextFollowUp,
      attachments: attachments || [],
      details: details || {},
      performedBy: employeeId,
    });

    await newActivity.save();

    // Update lead status based on activity type and outcome
    if (relatedTo.type === "Lead" && relatedTo.leadId) {
      try {
        const lead = await Lead.findById(relatedTo.leadId);
        if (lead) {
          const currentStatus = lead.status;
          let newStatus = currentStatus;
          
          // Update status based on activity type
          if (type === "Call" || type === "Email" || type === "SMS") {
            // If first contact, move from "New" to "Contacted"
            if (currentStatus === "New") {
              newStatus = "Contacted";
            }
            // If outcome is "Successful" or "Follow Up Required", move to "Qualified"
            else if (outcome === "Successful" || outcome === "Follow Up Required") {
              if (currentStatus === "Contacted") {
                newStatus = "Qualified";
              }
            }
            // If outcome is "Not Interested", move to "Closed Lost"
            else if (outcome === "Not Interested") {
              newStatus = "Closed Lost";
            }
          }
          // Meeting activities
          else if (type === "Meeting") {
            if (currentStatus === "New" || currentStatus === "Contacted") {
              newStatus = "Qualified";
            }
            // If outcome is successful, move to Proposal or Negotiation
            if (outcome === "Successful" || outcome === "Completed") {
              if (currentStatus === "Qualified") {
                newStatus = "Proposal";
              } else if (currentStatus === "Proposal") {
                newStatus = "Negotiation";
              }
            }
          }
          // Task completion
          else if (type === "Task" && outcome === "Completed") {
            if (currentStatus === "Qualified") {
              newStatus = "Proposal";
            } else if (currentStatus === "Proposal") {
              newStatus = "Negotiation";
            }
          }

          // Only update if status changed
          if (newStatus !== currentStatus) {
            lead.status = newStatus;
            lead.lastContacted = new Date();
            await lead.save();
            console.log(`Lead ${lead._id} status updated from ${currentStatus} to ${newStatus} based on activity`);
          } else {
            // Update lastContacted even if status didn't change
            lead.lastContacted = new Date();
            await lead.save();
          }
        }
      } catch (leadUpdateError) {
        // Log error but don't fail the activity creation
        console.error("Error updating lead status:", leadUpdateError);
      }
    }

    // Populate related fields
    await newActivity.populate("performedBy", "name lastName email");

    return res.status(201).json({ success: true, data: newActivity });
  } catch (error) {
    console.error("Error creating activity:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all activities
export const getAllActivities = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken?.companyId;
    const {
      type,
      relatedToType,
      leadId,
      customerId,
      performedBy,
      startDate,
      endDate,
      limit = 100,
    } = req.query;

    // Build filter
    const filter = { companyId };
    if (type) filter.type = type;
    if (performedBy) filter.performedBy = performedBy;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (relatedToType === "Lead" && leadId) {
      filter["relatedTo.leadId"] = new mongoose.Types.ObjectId(leadId);
    } else if (relatedToType === "Customer" && customerId) {
      filter["relatedTo.customerId"] = new mongoose.Types.ObjectId(customerId);
    }

    const activities = await Activity.find(filter)
      .populate("performedBy", "name lastName email")
      .populate({
        path: "relatedTo.leadId",
        select: "name email company",
        model: "Lead",
      })
      .populate({
        path: "relatedTo.customerId",
        select: "name email company",
        model: "Customer",
      })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get activity by ID
export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activity id" });
    }

    const activity = await Activity.findById(id)
      .populate("performedBy", "name lastName email")
      .populate("relatedTo.leadId", "name email company")
      .populate("relatedTo.customerId", "name email company");

    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    }

    return res.status(200).json({ success: true, data: activity });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update activity
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activity id" });
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("performedBy", "name lastName email")
      .populate("relatedTo.leadId", "name email company")
      .populate("relatedTo.customerId", "name email company");

    if (!updatedActivity) {
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    }

    return res.status(200).json({
      success: true,
      data: updatedActivity,
      message: "Activity updated successfully",
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete activity
export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activity id" });
    }

    const deletedActivity = await Activity.findByIdAndDelete(id);
    if (!deletedActivity) {
      return res
        .status(404)
        .json({ success: false, message: "Activity not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
      data: deletedActivity,
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

