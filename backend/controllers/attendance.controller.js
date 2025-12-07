import Attendance from "../models/Attendance.model.js";
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

// Check in
export const checkIn = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employeeId = req.body.employeeId || user.userId || user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      companyId: user.companyId || req.body.companyId,
      employeeId,
      date: today,
    });

    if (attendance && attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: "Already checked in today",
      });
    }

    if (!attendance) {
      attendance = new Attendance({
        companyId: user.companyId || req.body.companyId,
        employeeId,
        date: today,
        status: "present",
      });
    }

    attendance.checkIn = {
      time: new Date(),
      location: req.body.location || {},
      method: req.body.method || "web",
    };

    await attendance.save();
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Check out
export const checkOut = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employeeId = req.body.employeeId || user.userId || user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      companyId: user.companyId || req.body.companyId,
      employeeId,
      date: today,
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: "Please check in first",
      });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({
        success: false,
        message: "Already checked out today",
      });
    }

    attendance.checkOut = {
      time: new Date(),
      location: req.body.location || {},
      method: req.body.method || "web",
    };

    // Calculate working hours
    const checkInTime = new Date(attendance.checkIn.time);
    const checkOutTime = new Date(attendance.checkOut.time);
    const diffMs = checkOutTime - checkInTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    const breakDuration = req.body.breakDuration || attendance.breakDuration || 0;
    const workingHours = Math.max(0, diffHours - breakDuration / 60);

    attendance.workingHours = workingHours;
    attendance.breakDuration = breakDuration;

    // Calculate overtime (assuming 8 hours is standard)
    const standardHours = 8;
    if (workingHours > standardHours) {
      attendance.overtimeHours = workingHours - standardHours;
    }

    await attendance.save();
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get attendance records
export const getAttendance = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { employeeId, startDate, endDate, status } = req.query;
    const companyId = user.companyId || req.query.companyId;

    const query = { companyId };

    if (employeeId) {
      query.employeeId = employeeId;
    } else if (user.role !== "Admin") {
      // Non-admins can only see their own attendance
      query.employeeId = user.userId || user.id;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (status) query.status = status;

    const attendance = await Attendance.find(query)
      .populate("employeeId", "name lastName email")
      .populate("approvedBy", "name lastName")
      .sort({ date: -1 });

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance by ID
export const getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate("employeeId", "name lastName email")
      .populate("approvedBy", "name lastName");

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update attendance (manual entry)
export const updateAttendance = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        approvedBy: user.userId || user.id,
        approvedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete attendance
export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    res.json({ success: true, message: "Attendance record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance statistics
export const getAttendanceStatistics = async (req, res) => {
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
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const [
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      totalWorkingHours,
      totalOvertimeHours,
      byStatus,
    ] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.countDocuments({ ...query, status: "present" }),
      Attendance.countDocuments({ ...query, status: "absent" }),
      Attendance.countDocuments({ ...query, status: "late" }),
      Attendance.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$workingHours" } } },
      ]),
      Attendance.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$overtimeHours" } } },
      ]),
      Attendance.aggregate([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        totalWorkingHours: totalWorkingHours[0]?.total || 0,
        totalOvertimeHours: totalOvertimeHours[0]?.total || 0,
        byStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

