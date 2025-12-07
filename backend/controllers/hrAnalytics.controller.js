import Employee from "../models/employees.model.js";
import Applicant from "../models/Applicant.model.js";
import CourseEnrollment from "../models/CourseEnrollment.model.js";
import Attendance from "../models/Attendance.model.js";
import LeaveRequest from "../models/LeaveRequest.model.js";
import PerformanceReview from "../models/performanceReview.model.js";
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

// Get comprehensive HR analytics
export const getHRAnalytics = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = user.companyId || req.query.companyId;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Employee Statistics
    const [
      totalEmployees,
      activeEmployees,
      employeesByDepartment,
      employeesByRole,
      newHires,
      turnoverRate,
    ] = await Promise.all([
      Employee.countDocuments({ companyId }),
      Employee.countDocuments({ companyId, status: "active" }),
      Employee.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
          },
        },
        { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "department" } },
        { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
      ]),
      Employee.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
      Employee.countDocuments({
        companyId,
        createdAt: dateFilter.createdAt || { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      // Calculate turnover (employees who left in the period)
      Employee.countDocuments({
        companyId,
        status: "inactive",
        updatedAt: dateFilter.createdAt || {},
      }),
    ]);

    // Recruitment Statistics
    const [
      totalApplicants,
      applicantsByStatus,
      applicantsBySource,
      averageTimeToHire,
      offerAcceptanceRate,
    ] = await Promise.all([
      Applicant.countDocuments({ companyId }),
      Applicant.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Applicant.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Applicant.aggregate([
        {
          $match: {
            companyId,
            status: "offer_accepted",
            hiredDate: { $exists: true },
          },
        },
        {
          $project: {
            daysToHire: {
              $divide: [
                { $subtract: ["$hiredDate", "$applicationDate"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgDays: { $avg: "$daysToHire" },
          },
        },
      ]),
      Applicant.aggregate([
        {
          $match: {
            companyId,
            status: { $in: ["offer_extended", "offer_accepted", "offer_declined"] },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Learning & Development Statistics
    const [
      totalCourses,
      totalEnrollments,
      completionRate,
      averageProgress,
      coursesByCategory,
    ] = await Promise.all([
      CourseEnrollment.distinct("courseId", { companyId }).then((ids) => ids.length),
      CourseEnrollment.countDocuments({ companyId }),
      CourseEnrollment.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            completionRate: {
              $multiply: [
                { $divide: ["$completed", "$total"] },
                100,
              ],
            },
          },
        },
      ]),
      CourseEnrollment.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, avgProgress: { $avg: "$progress" } } },
      ]),
      CourseEnrollment.aggregate([
        { $match: { companyId } },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course",
          },
        },
        { $unwind: "$course" },
        { $group: { _id: "$course.category", count: { $sum: 1 } } },
      ]),
    ]);

    // Attendance Statistics
    const [
      attendanceRecords,
      averageAttendanceRate,
      lateArrivals,
      absences,
    ] = await Promise.all([
      Attendance.countDocuments({ companyId }),
      Attendance.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            attendanceRate: {
              $multiply: [{ $divide: ["$present", "$total"] }, 100],
            },
          },
        },
      ]),
      Attendance.countDocuments({ companyId, status: "late" }),
      Attendance.countDocuments({ companyId, status: "absent" }),
    ]);

    // Leave Statistics
    const [
      totalLeaveRequests,
      leaveRequestsByType,
      leaveRequestsByStatus,
      averageLeaveDays,
    ] = await Promise.all([
      LeaveRequest.countDocuments({ companyId }),
      LeaveRequest.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$leaveType", count: { $sum: 1 }, totalDays: { $sum: "$days" } } },
      ]),
      LeaveRequest.aggregate([
        { $match: { companyId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      LeaveRequest.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, avgDays: { $avg: "$days" } } },
      ]),
    ]);

    // Performance Statistics
    const [
      totalReviews,
      averageRating,
      reviewsByRating,
    ] = await Promise.all([
      PerformanceReview.countDocuments({ companyId }),
      PerformanceReview.aggregate([
        { $match: { companyId } },
        { $group: { _id: null, avgRating: { $avg: "$overallRating" } } },
      ]),
      PerformanceReview.aggregate([
        { $match: { companyId } },
        {
          $bucket: {
            groupBy: "$overallRating",
            boundaries: [1, 2, 3, 4, 5, 6],
            default: "other",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          byDepartment: employeesByDepartment,
          byRole: employeesByRole,
          newHires,
          turnoverRate: totalEmployees > 0 ? (turnoverRate / totalEmployees) * 100 : 0,
        },
        recruitment: {
          totalApplicants,
          byStatus: applicantsByStatus,
          bySource: applicantsBySource,
          averageTimeToHire: averageTimeToHire[0]?.avgDays || 0,
          offerAcceptanceRate: offerAcceptanceRate.length > 0
            ? (offerAcceptanceRate.find((s) => s._id === "offer_accepted")?.count || 0) /
              (offerAcceptanceRate.reduce((sum, s) => sum + s.count, 0) || 1) * 100
            : 0,
        },
        learning: {
          totalCourses,
          totalEnrollments,
          completionRate: completionRate[0]?.completionRate || 0,
          averageProgress: averageProgress[0]?.avgProgress || 0,
          byCategory: coursesByCategory,
        },
        attendance: {
          totalRecords: attendanceRecords,
          averageRate: averageAttendanceRate[0]?.attendanceRate || 0,
          lateArrivals,
          absences,
        },
        leave: {
          totalRequests,
          byType: leaveRequestsByType,
          byStatus: leaveRequestsByStatus,
          averageDays: averageLeaveDays[0]?.avgDays || 0,
        },
        performance: {
          totalReviews,
          averageRating: averageRating[0]?.avgRating || 0,
          byRating: reviewsByRating,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get employee self-service data
export const getEmployeeSelfServiceData = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employeeId = req.params.employeeId || user.userId || user.id;
    const companyId = user.companyId || req.query.companyId;

    const [
      employee,
      attendance,
      leaveRequests,
      enrollments,
      performanceReviews,
    ] = await Promise.all([
      Employee.findById(employeeId).select("-password"),
      Attendance.find({ companyId, employeeId })
        .sort({ date: -1 })
        .limit(30),
      LeaveRequest.find({ companyId, employeeId })
        .sort({ requestedAt: -1 })
        .limit(10),
      CourseEnrollment.find({ companyId, employeeId })
        .populate("courseId", "title description duration")
        .sort({ createdAt: -1 })
        .limit(10),
      PerformanceReview.find({ companyId, employeeId })
        .sort({ reviewDate: -1 })
        .limit(5),
    ]);

    // Calculate attendance summary
    const attendanceSummary = {
      present: attendance.filter((a) => a.status === "present").length,
      absent: attendance.filter((a) => a.status === "absent").length,
      late: attendance.filter((a) => a.status === "late").length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
    };

    res.json({
      success: true,
      data: {
        employee,
        attendance: {
          records: attendance,
          summary: attendanceSummary,
        },
        leaveRequests,
        enrollments,
        performanceReviews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

