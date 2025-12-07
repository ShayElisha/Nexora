import LeaveRequest from "../models/LeaveRequest.model.js";
import Employee from "../models/employees.model.js";
import jwt from "jsonwebtoken";

// Helper to get user from token
const getUserFromToken = (req) => {
  const token = req.cookies["auth_token"];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Create leave request
export const createLeaveRequest = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employeeId = req.body.employeeId || user.userId || user.id;
    const { startDate, endDate, leaveType } = req.body;

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check if employee has enough balance (for vacation/sick leave)
    if (leaveType === "vacation" || leaveType === "sick") {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }

      const balance = leaveType === "vacation" ? employee.vacationBalance : employee.sickBalance;
      if (balance < diffDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} balance. Available: ${balance} days, Requested: ${diffDays} days`,
        });
      }
    }

    const leaveRequest = new LeaveRequest({
      ...req.body,
      companyId: user.companyId || req.body.companyId,
      employeeId,
      days: diffDays,
    });

    await leaveRequest.save();
    res.status(201).json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get leave requests
export const getLeaveRequests = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { employeeId, status, leaveType, startDate, endDate } = req.query;
    const companyId = user.companyId || req.query.companyId;

    const query = { companyId };

    if (employeeId) {
      query.employeeId = employeeId;
    } else if (user.role !== "Admin") {
      // Non-admins can only see their own requests
      query.employeeId = user.userId || user.id;
    }

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (startDate || endDate) {
      query.$or = [
        {
          startDate: {
            $gte: startDate ? new Date(startDate) : undefined,
            $lte: endDate ? new Date(endDate) : undefined,
          },
        },
        {
          endDate: {
            $gte: startDate ? new Date(startDate) : undefined,
            $lte: endDate ? new Date(endDate) : undefined,
          },
        },
      ];
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate("employeeId", "name lastName email")
      .populate("reviewedBy", "name lastName")
      .populate("coverage", "name lastName")
      .populate("comments.addedBy", "name lastName")
      .sort({ requestedAt: -1 });

    res.json({ success: true, data: leaveRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get leave request by ID
export const getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate("employeeId", "name lastName email")
      .populate("reviewedBy", "name lastName")
      .populate("coverage", "name lastName email")
      .populate("comments.addedBy", "name lastName");

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    res.json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update leave request
export const updateLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    res.json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Approve leave request
export const approveLeaveRequest = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (leaveRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leaveRequest.status}`,
      });
    }

    // Deduct from employee balance if vacation or sick leave
    if (leaveRequest.leaveType === "vacation" || leaveRequest.leaveType === "sick") {
      const employee = await Employee.findById(leaveRequest.employeeId);
      if (employee) {
        if (leaveRequest.leaveType === "vacation") {
          employee.vacationBalance -= leaveRequest.days;
          employee.vacationHistory.push({
            month: new Date().toLocaleDateString("en-US", { month: "2-digit", year: "numeric" }),
            daysAdded: -leaveRequest.days,
            newBalance: employee.vacationBalance,
            country: employee.address?.country || "Unknown",
          });
        } else if (leaveRequest.leaveType === "sick") {
          employee.sickBalance -= leaveRequest.days;
          employee.sickHistory.push({
            month: new Date().toLocaleDateString("en-US", { month: "2-digit", year: "numeric" }),
            daysAdded: -leaveRequest.days,
            newBalance: employee.sickBalance,
            country: employee.address?.country || "Unknown",
          });
        }
        await employee.save();
      }
    }

    leaveRequest.status = "approved";
    leaveRequest.reviewedBy = user.userId || user.id;
    leaveRequest.reviewedAt = new Date();

    await leaveRequest.save();
    res.json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Reject leave request
export const rejectLeaveRequest = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (leaveRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leaveRequest.status}`,
      });
    }

    leaveRequest.status = "rejected";
    leaveRequest.reviewedBy = user.userId || user.id;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.rejectionReason = req.body.rejectionReason || "";

    await leaveRequest.save();
    res.json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cancel leave request
export const cancelLeaveRequest = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    // Only employee or admin can cancel
    const employeeId = user.userId || user.id;
    if (leaveRequest.employeeId.toString() !== employeeId.toString() && user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own leave requests",
      });
    }

    if (leaveRequest.status === "approved") {
      // Refund balance if vacation or sick leave
      if (leaveRequest.leaveType === "vacation" || leaveRequest.leaveType === "sick") {
        const employee = await Employee.findById(leaveRequest.employeeId);
        if (employee) {
          if (leaveRequest.leaveType === "vacation") {
            employee.vacationBalance += leaveRequest.days;
          } else if (leaveRequest.leaveType === "sick") {
            employee.sickBalance += leaveRequest.days;
          }
          await employee.save();
        }
      }
    }

    leaveRequest.status = "cancelled";
    await leaveRequest.save();
    res.json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Add comment to leave request
export const addComment = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    leaveRequest.comments.push({
      comment: req.body.comment,
      addedBy: user.userId || user.id,
    });

    await leaveRequest.save();
    res.json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get leave statistics
export const getLeaveStatistics = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { employeeId, startDate, endDate } = req.query;
    const companyId = user.companyId || req.query.companyId;

    const query = { companyId };
    if (employeeId) query.employeeId = employeeId;
    if (startDate || endDate) {
      query.$or = [
        {
          startDate: {
            $gte: startDate ? new Date(startDate) : undefined,
            $lte: endDate ? new Date(endDate) : undefined,
          },
        },
        {
          endDate: {
            $gte: startDate ? new Date(startDate) : undefined,
            $lte: endDate ? new Date(endDate) : undefined,
          },
        },
      ];
    }

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      byLeaveType,
      byStatus,
    ] = await Promise.all([
      LeaveRequest.countDocuments(query),
      LeaveRequest.countDocuments({ ...query, status: "pending" }),
      LeaveRequest.countDocuments({ ...query, status: "approved" }),
      LeaveRequest.countDocuments({ ...query, status: "rejected" }),
      LeaveRequest.aggregate([
        { $match: query },
        { $group: { _id: "$leaveType", count: { $sum: 1 }, totalDays: { $sum: "$days" } } },
      ]),
      LeaveRequest.aggregate([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        byLeaveType,
        byStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

