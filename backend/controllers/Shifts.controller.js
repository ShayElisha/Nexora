import Shift from "../models/Shifts.model.js";
import Employee from "../models/employees.model.js";
import PayRate from "../models/PayRates.model.js";
import Salary from "../models/salary.model.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import dotenv from "dotenv";

export const createShift = async (req, res) => {
  try {
    // Validate environment variables
    if (!process.env.JWT_SECRET || !process.env.CALENDARIFIC_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "שגיאת שרת: הגדרות מערכת חסרות",
      });
    }

    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const employeeId = decodedToken.employeeId;
    const { shiftDate, startTime, endTime, notes, hoursWorked } = req.body;

    // Validate required fields
    if (!shiftDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: "shiftDate ו-startTime הם שדות חובה",
      });
    }

    // Validate employee
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.companyId.toString() !== decodedToken.companyId) {
      return res.status(404).json({
        success: false,
        message: "העובד לא נמצא או אינו שייך לחברה זו",
      });
    }

    // Check for overlapping shifts
    const shiftDateObj = new Date(shiftDate);
    const newStart = new Date(startTime);
    const newEnd = endTime ? new Date(endTime) : null;

    const overlappingShifts = await Shift.find({
      employeeId,
      companyId: decodedToken.companyId,
      shiftDate: {
        $gte: new Date(shiftDateObj.setHours(0, 0, 0, 0)),
        $lte: new Date(shiftDateObj.setHours(23, 59, 59, 999)),
      },
      $or: [
        {
          $and: [
            { startTime: { $lte: newEnd || newStart } },
            { endTime: { $gte: newStart } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: newStart } },
            { startTime: { $lte: newEnd || newStart } },
          ],
        },
      ],
    });

    if (overlappingShifts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "קיימת משמרת חופפת בטווח השעות שנבחר",
      });
    }

    // Fetch pay rates
    const payRates = await PayRate.find({
      companyId: decodedToken.companyId,
      isActive: true,
    });
    const regularRate = payRates.find((r) => r.rateType === "Regular") || {
      _id: null,
      multiplier: 1.0,
      hoursThreshold: 8,
    };
    const overtime125Rate = payRates.find(
      (r) => r.rateType === "Overtime125"
    ) || {
      _id: null,
      multiplier: 1.25,
      hoursThreshold: 2,
    };
    const overtime150Rate = payRates.find(
      (r) => r.rateType === "Overtime150"
    ) || {
      _id: null,
      multiplier: 1.5,
    };
    const nightRate = payRates.find((r) => r.rateType === "Night") || {
      _id: null,
      multiplier: 1.25,
    };
    const holidayRate = payRates.find((r) => r.rateType === "Holiday") || {
      _id: null,
      multiplier: 1.5,
    };
    const restDayRate = payRates.find((r) => r.rateType === "RestDay") || {
      _id: null,
      multiplier: 1.5,
    };

    // Determine hourly salary
    const effectiveHourlySalary =
      employee.paymentType === "Hourly" && employee.hourlySalary
        ? employee.hourlySalary
        : 0;

    // Calculate hours worked
    let effectiveHoursWorked = hoursWorked ? parseFloat(hoursWorked) : 0;
    if (!hoursWorked && newStart && newEnd) {
      if (newEnd > newStart) {
        effectiveHoursWorked = (newEnd - newStart) / (1000 * 60 * 60);
      }
    }

    // Initialize shift properties
    let payRateId = regularRate._id;
    let shiftType = "Day";
    let dayType = "Regular";
    let shiftBreakdown = [];

    // Check for holidays
    const year = shiftDateObj.getFullYear();
    const month = shiftDateObj.getMonth() + 1;
    const day = shiftDateObj.getDate();
    let isHoliday = false;

    try {
      const response = await axios.get(
        "https://calendarific.com/api/v2/holidays",
        {
          params: {
            api_key: process.env.CALENDARIFIC_API_KEY,
            country: "IL",
            year,
            month,
            day,
          },
        }
      );
      const holidays = response.data.response.holidays;
      isHoliday = holidays && holidays.length > 0;
      if (isHoliday) {
        dayType = "Holiday";
        payRateId = holidayRate._id;
        shiftBreakdown.push({
          rateType: "Holiday",
          hours: effectiveHoursWorked,
          multiplier: holidayRate.multiplier,
          payRateId: holidayRate._id,
        });
      }
    } catch (apiError) {
      console.warn("Failed to fetch holidays:", apiError.message);
    }

    // Check for rest day (Saturday)
    if (!isHoliday && shiftDateObj.getDay() === 6) {
      dayType = "RestDay";
      payRateId = restDayRate._id;
      shiftBreakdown.push({
        rateType: "RestDay",
        hours: effectiveHoursWorked,
        multiplier: restDayRate.multiplier,
        payRateId: restDayRate._id,
      });
    }

    // Check for night shift
    const startHour = newStart.getHours();
    const endHour = newEnd ? newEnd.getHours() : null;
    const isNightShift = startHour >= 22 || (endHour !== null && endHour <= 6);
    if (isNightShift && dayType === "Regular") {
      shiftType = "Night";
      payRateId = nightRate._id;
      shiftBreakdown.push({
        rateType: "Night",
        hours: effectiveHoursWorked,
        multiplier: nightRate.multiplier,
        payRateId: nightRate._id,
      });
    }

    // Regular day shift breakdown
    if (dayType === "Regular" && !isNightShift) {
      let remainingHours = effectiveHoursWorked;
      const regularThreshold = regularRate.hoursThreshold;
      const overtime125Threshold = overtime125Rate.hoursThreshold;

      const regularHours = Math.min(remainingHours, regularThreshold);
      if (regularHours > 0) {
        shiftBreakdown.push({
          rateType: "Regular",
          hours: regularHours,
          multiplier: regularRate.multiplier,
          payRateId: regularRate._id,
        });
        remainingHours -= regularHours;
      }

      const overtime125Hours = Math.min(remainingHours, overtime125Threshold);
      if (overtime125Hours > 0) {
        shiftBreakdown.push({
          rateType: "Overtime125",
          hours: overtime125Hours,
          multiplier: overtime125Rate.multiplier,
          payRateId: overtime125Rate._id,
        });
        remainingHours -= overtime125Hours;
      }

      const overtime150Hours = remainingHours;
      if (overtime150Hours > 0) {
        shiftBreakdown.push({
          rateType: "Overtime150",
          hours: overtime150Hours,
          multiplier: overtime150Rate.multiplier,
          payRateId: overtime150Rate._id,
        });
      }
    }

    // Calculate total pay
    let totalPay = 0;
    shiftBreakdown.forEach((part) => {
      totalPay += part.hours * effectiveHourlySalary * part.multiplier;
    });

    // Create shift
    const shift = new Shift({
      companyId: decodedToken.companyId,
      employeeId,
      hoursWorked: effectiveHoursWorked,
      hourlySalary: effectiveHourlySalary,
      shiftDate: shiftDateObj,
      startTime: newStart,
      endTime: newEnd,
      notes: notes || "",
      shiftType,
      dayType,
      payRateId,
      shiftBreakdown,
      totalPay,
    });

    await shift.save();

    // Update or create salary record
    const periodStart = new Date(
      shiftDateObj.getFullYear(),
      shiftDateObj.getMonth(),
      1
    );
    const periodEnd = new Date(
      shiftDateObj.getFullYear(),
      shiftDateObj.getMonth() + 1,
      0
    );

    let salary = await Salary.findOne({
      employeeId,
      periodStart,
      companyId: decodedToken.companyId,
    });

    if (!salary) {
      salary = new Salary({
        companyId: decodedToken.companyId,
        employeeId,
        periodStart,
        periodEnd,
        totalHours: effectiveHoursWorked,
        totalPay,
        bonus: 0,
        taxDeduction: 0,
        otherDeductions: [],
        netPay: totalPay,
        shifts: [shift._id],
        status: "Draft",
        notes: "",
      });
    } else {
      salary.totalHours = (
        Number(salary.totalHours) + effectiveHoursWorked
      ).toFixed(2);
      salary.totalPay = (Number(salary.totalPay) + totalPay).toFixed(2);
      if (!salary.shifts) salary.shifts = []; // Initialize shifts array if undefined
      salary.shifts.push(shift._id);
      const totalDeductions = salary.otherDeductions.reduce(
        (sum, d) => sum + Number(d.amount),
        0
      );
      salary.netPay = (
        Number(salary.totalPay) -
        (Number(salary.taxDeduction || 0) + totalDeductions)
      ).toFixed(2);
    }

    await salary.save();

    // Populate shift details
    const populatedShift = await Shift.findById(shift._id)
      .populate("companyId", "name")
      .populate("employeeId", "name lastName email")
      .populate("payRateId", "rateType multiplier");

    res.status(201).json({ success: true, data: populatedShift });
  } catch (error) {
    console.error("Error creating shift:", error.message);
    res.status(500).json({
      success: false,
      message: "שגיאה ביצירת משמרת: " + error.message,
    });
  }
};

export const updateShift = async (req, res) => {
  try {
    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { id } = req.params;
    const updates = req.body;

    // Validate updates
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "לא נשלחו נתונים לעדכון",
      });
    }

    // Define allowed updates
    const allowedUpdates = [
      "hoursWorked",
      "hourlySalary",
      "shiftDate",
      "startTime",
      "endTime",
      "notes",
      "shiftType",
      "dayType",
    ];

    // Validate updates
    const isValidUpdate = Object.keys(updates).every((key) =>
      allowedUpdates.includes(key)
    );
    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: "שדות עדכון לא חוקיים",
      });
    }

    // Validate input data
    if (updates.shiftDate && isNaN(Date.parse(updates.shiftDate))) {
      return res
        .status(400)
        .json({ success: false, message: "תאריך המשמרת אינו תקין" });
    }
    if (updates.startTime && isNaN(Date.parse(updates.startTime))) {
      return res
        .status(400)
        .json({ success: false, message: "שעת ההתחלה אינה תקינה" });
    }
    if (updates.endTime && isNaN(Date.parse(updates.endTime))) {
      return res
        .status(400)
        .json({ success: false, message: "שעת הסיום אינה תקינה" });
    }
    if (
      updates.hoursWorked !== undefined &&
      (isNaN(updates.hoursWorked) || updates.hoursWorked < 0)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "שעות עבודה חייבות להיות מספר חיובי",
        });
    }
    if (
      updates.hourlySalary !== undefined &&
      (isNaN(updates.hourlySalary) || updates.hourlySalary < 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "שכר שעתי חייב להיות מספר חיובי" });
    }
    if (updates.shiftType && !["Day", "Night"].includes(updates.shiftType)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "סוג משמרת לא תקין. מותר: Day, Night",
        });
    }
    if (
      updates.dayType &&
      !["Regular", "Holiday", "RestDay"].includes(updates.dayType)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "סוג יום לא תקין. מותר: Regular, Holiday, RestDay",
        });
    }
    if (
      updates.startTime &&
      updates.endTime &&
      new Date(updates.endTime) <= new Date(updates.startTime)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "שעת הסיום חייבת להיות מאוחרת משעת ההתחלה",
        });
    }

    // Find shift
    const shift = await Shift.findById(id);
    if (!shift || shift.companyId.toString() !== decodedToken.companyId) {
      return res.status(404).json({
        success: false,
        message: "המשמרת לא נמצאה או אינה שייכת לחברה זו",
      });
    }

    // Check for overlapping shifts
    const newStart = updates.startTime
      ? new Date(updates.startTime)
      : shift.startTime;
    const newEnd = updates.endTime ? new Date(updates.endTime) : shift.endTime;
    const shiftDateObj = updates.shiftDate
      ? new Date(updates.shiftDate)
      : shift.shiftDate;

    const overlappingShifts = await Shift.find({
      employeeId: shift.employeeId,
      companyId: decodedToken.companyId,
      shiftDate: {
        $gte: new Date(shiftDateObj.setHours(0, 0, 0, 0)),
        $lte: new Date(shiftDateObj.setHours(23, 59, 59, 999)),
      },
      _id: { $ne: id },
      $or: [
        {
          $and: [
            { startTime: { $lte: newEnd || newStart } },
            { endTime: { $gte: newStart } },
          ],
        },
        {
          $and: [
            { startTime: { $gte: newStart } },
            { startTime: { $lte: newEnd || newStart } },
          ],
        },
      ],
    });

    if (overlappingShifts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "קיימת משמרת חופפת בטווח השעות שנבחר",
      });
    }

    // Validate employee
    const employee = await Employee.findById(shift.employeeId);
    if (!employee || employee.companyId.toString() !== decodedToken.companyId) {
      return res.status(404).json({
        success: false,
        message: "העובד לא נמצא או אינו שייך לחברה זו",
      });
    }

    // Store old values
    const oldHoursWorked = shift.hoursWorked || 0;
    const oldTotalPay = shift.totalPay || 0;
    const oldShiftDate = shift.shiftDate;

    // Apply updates
    Object.assign(shift, updates);
    if (updates.shiftDate) shift.shiftDate = new Date(updates.shiftDate);
    if (updates.startTime) shift.startTime = new Date(updates.startTime);
    if (updates.endTime)
      shift.endTime = updates.endTime ? new Date(updates.endTime) : null;
    if (updates.notes) shift.notes = updates.notes;
    if (updates.shiftType) shift.shiftType = updates.shiftType;
    if (updates.dayType) shift.dayType = updates.dayType;
    if (updates.hourlySalary)
      shift.hourlySalary = parseFloat(updates.hourlySalary);
    else
      shift.hourlySalary =
        employee.paymentType === "Hourly" && employee.hourlySalary
          ? employee.hourlySalary
          : 0;

    // Calculate hours worked
    let effectiveHoursWorked = shift.hoursWorked || 0;
    if (updates.startTime || updates.endTime) {
      if (shift.startTime && shift.endTime) {
        const start = shift.startTime;
        const end = shift.endTime;
        if (end > start) {
          effectiveHoursWorked = (end - start) / (1000 * 60 * 60);
        } else {
          return res.status(400).json({
            success: false,
            message: "שעת הסיום חייבת להיות מאוחרת משעת ההתחלה",
          });
        }
      }
    } else if (updates.hoursWorked) {
      effectiveHoursWorked = parseFloat(updates.hoursWorked);
    }
    shift.hoursWorked = effectiveHoursWorked;

    // Fetch pay rates
    const payRates = await PayRate.find({
      companyId: decodedToken.companyId,
      isActive: true,
    });
    const regularRate = payRates.find((r) => r.rateType === "Regular") || {
      _id: null,
      multiplier: 1.0,
      hoursThreshold: 8,
    };
    const overtime125Rate = payRates.find(
      (r) => r.rateType === "Overtime125"
    ) || {
      _id: null,
      multiplier: 1.25,
      hoursThreshold: 2,
    };
    const overtime150Rate = payRates.find(
      (r) => r.rateType === "Overtime150"
    ) || {
      _id: null,
      multiplier: 1.5,
    };
    const nightRate = payRates.find((r) => r.rateType === "Night") || {
      _id: null,
      multiplier: 1.25,
    };
    const holidayRate = payRates.find((r) => r.rateType === "Holiday") || {
      _id: null,
      multiplier: 1.5,
    };
    const restDayRate = payRates.find((r) => r.rateType === "RestDay") || {
      _id: null,
      multiplier: 1.5,
    };

    // Initialize shift properties
    let payRateId = regularRate._id;
    let shiftType = shift.shiftType || "Day";
    let dayType = shift.dayType || "Regular";
    let shiftBreakdown = [];

    // Check for holidays
    const year = shiftDateObj.getFullYear();
    const month = shiftDateObj.getMonth() + 1;
    const day = shiftDateObj.getDate();
    let isHoliday = false;

    try {
      const response = await axios.get(
        "https://calendarific.com/api/v2/holidays",
        {
          params: {
            api_key: process.env.CALENDARIFIC_API_KEY,
            country: "IL",
            year,
            month,
            day,
          },
        }
      );
      const holidays = response.data.response.holidays;
      isHoliday = holidays && holidays.length > 0;
      if (isHoliday && !updates.dayType) {
        dayType = "Holiday";
        payRateId = holidayRate._id;
        shiftBreakdown.push({
          rateType: "Holiday",
          hours: effectiveHoursWorked,
          multiplier: holidayRate.multiplier,
          payRateId: holidayRate._id,
        });
      }
    } catch (apiError) {
      console.warn("Failed to fetch holidays:", apiError.message);
    }

    // Check for rest day (Saturday)
    if (!isHoliday && shiftDateObj.getDay() === 6 && !updates.dayType) {
      dayType = "RestDay";
      payRateId = restDayRate._id;
      shiftBreakdown.push({
        rateType: "RestDay",
        hours: effectiveHoursWorked,
        multiplier: restDayRate.multiplier,
        payRateId: restDayRate._id,
      });
    }

    // Check for night shift
    const startHour = shift.startTime.getHours();
    const endHour = shift.endTime ? shift.endTime.getHours() : null;
    const isNightShift = startHour >= 22 || (endHour !== null && endHour <= 6);
    if (isNightShift && dayType === "Regular" && !updates.shiftType) {
      shiftType = "Night";
      payRateId = nightRate._id;
      shiftBreakdown.push({
        rateType: "Night",
        hours: effectiveHoursWorked,
        multiplier: nightRate.multiplier,
        payRateId: nightRate._id,
      });
    }

    // Regular day shift breakdown
    if (dayType === "Regular" && !isNightShift) {
      let remainingHours = effectiveHoursWorked;
      const regularThreshold = regularRate.hoursThreshold;
      const overtime125Threshold = overtime125Rate.hoursThreshold;

      const regularHours = Math.min(remainingHours, regularThreshold);
      if (regularHours > 0) {
        shiftBreakdown.push({
          rateType: "Regular",
          hours: regularHours,
          multiplier: regularRate.multiplier,
          payRateId: regularRate._id,
        });
        remainingHours -= regularHours;
      }

      const overtime125Hours = Math.min(remainingHours, overtime125Threshold);
      if (overtime125Hours > 0) {
        shiftBreakdown.push({
          rateType: "Overtime125",
          hours: overtime125Hours,
          multiplier: overtime125Rate.multiplier,
          payRateId: overtime125Rate._id,
        });
        remainingHours -= overtime125Hours;
      }

      const overtime150Hours = remainingHours;
      if (overtime150Hours > 0) {
        shiftBreakdown.push({
          rateType: "Overtime150",
          hours: overtime150Hours,
          multiplier: overtime150Rate.multiplier,
          payRateId: overtime150Rate._id,
        });
      }
    }

    // Calculate total pay
    let totalPay = 0;
    shiftBreakdown.forEach((part) => {
      totalPay += part.hours * shift.hourlySalary * part.multiplier;
    });

    // Update shift
    shift.shiftType = shiftType;
    shift.dayType = dayType;
    shift.payRateId = payRateId;
    shift.shiftBreakdown = shiftBreakdown;
    shift.totalPay = totalPay.toFixed(2);

    await shift.save();

    // Update salary record
    const employeeId = shift.employeeId;
    const oldPeriodStart = new Date(
      oldShiftDate.getFullYear(),
      oldShiftDate.getMonth(),
      1
    );
    const oldPeriodEnd = new Date(
      oldShiftDate.getFullYear(),
      oldShiftDate.getMonth() + 1,
      0
    );
    const newPeriodStart = new Date(
      shiftDateObj.getFullYear(),
      shiftDateObj.getMonth(),
      1
    );
    const newPeriodEnd = new Date(
      shiftDateObj.getFullYear(),
      shiftDateObj.getMonth() + 1,
      0
    );

    if (
      oldShiftDate.getMonth() !== shiftDateObj.getMonth() ||
      oldShiftDate.getFullYear() !== shiftDateObj.getFullYear()
    ) {
      // Remove shift contribution from old salary
      let oldSalary = await Salary.findOne({
        employeeId,
        periodStart: oldPeriodStart,
        companyId: decodedToken.companyId,
      });

      if (oldSalary) {
        oldSalary.totalHours = (
          Number(oldSalary.totalHours) - oldHoursWorked
        ).toFixed(2);
        oldSalary.totalPay = (Number(oldSalary.totalPay) - oldTotalPay).toFixed(
          2
        );
        oldSalary.shifts = oldSalary.shifts.filter(
          (shiftId) => shiftId.toString() !== id
        );
        const totalDeductions = oldSalary.otherDeductions.reduce(
          (sum, d) => sum + Number(d.amount),
          0
        );
        oldSalary.netPay = (
          Number(oldSalary.totalPay) -
          (Number(oldSalary.taxDeduction || 0) + totalDeductions)
        ).toFixed(2);
        if (oldSalary.shifts.length === 0) {
          await oldSalary.deleteOne();
        } else {
          await oldSalary.save();
        }
      }

      // Add shift contribution to new salary
      let newSalary = await Salary.findOne({
        employeeId,
        periodStart: newPeriodStart,
        companyId: decodedToken.companyId,
      });

      if (!newSalary) {
        newSalary = new Salary({
          companyId: decodedToken.companyId,
          employeeId,
          periodStart: newPeriodStart,
          periodEnd: newPeriodEnd,
          totalHours: effectiveHoursWorked.toFixed(2),
          totalPay: totalPay.toFixed(2),
          bonus: 0,
          taxDeduction: 0,
          otherDeductions: [],
          netPay: totalPay.toFixed(2),
          shifts: [shift._id],
          status: "Draft",
          notes: "",
        });
      } else {
        newSalary.totalHours = (
          Number(newSalary.totalHours) + effectiveHoursWorked
        ).toFixed(2);
        newSalary.totalPay = (Number(newSalary.totalPay) + totalPay).toFixed(2);
        if (!newSalary.shifts) newSalary.shifts = []; // Initialize shifts array if undefined
        if (!newSalary.shifts.includes(shift._id)) {
          newSalary.shifts.push(shift._id);
        }
        const totalDeductions = newSalary.otherDeductions.reduce(
          (sum, d) => sum + Number(d.amount),
          0
        );
        newSalary.netPay = (
          Number(newSalary.totalPay) -
          (Number(newSalary.taxDeduction || 0) + totalDeductions)
        ).toFixed(2);
      }

      await newSalary.save();
    } else {
      // Update existing salary for the same period
      let salary = await Salary.findOne({
        employeeId,
        periodStart: newPeriodStart,
        companyId: decodedToken.companyId,
      });

      if (!salary) {
        salary = new Salary({
          companyId: decodedToken.companyId,
          employeeId,
          periodStart: newPeriodStart,
          periodEnd: newPeriodEnd,
          totalHours: effectiveHoursWorked.toFixed(2),
          totalPay: totalPay.toFixed(2),
          bonus: 0,
          taxDeduction: 0,
          otherDeductions: [],
          netPay: totalPay.toFixed(2),
          shifts: [shift._id],
          status: "Draft",
          notes: "",
        });
      } else {
        salary.totalHours = (
          Number(salary.totalHours) -
          oldHoursWorked +
          effectiveHoursWorked
        ).toFixed(2);
        salary.totalPay = (
          Number(salary.totalPay) -
          oldTotalPay +
          totalPay
        ).toFixed(2);
        if (!salary.shifts) salary.shifts = []; // Initialize shifts array if undefined
        if (!salary.shifts.includes(shift._id)) {
          salary.shifts.push(shift._id);
        }
        const totalDeductions = salary.otherDeductions.reduce(
          (sum, d) => sum + Number(d.amount),
          0
        );
        salary.netPay = (
          Number(salary.totalPay) -
          (Number(salary.taxDeduction || 0) + totalDeductions)
        ).toFixed(2);
      }

      await salary.save();
    }

    // Populate shift details
    const populatedShift = await Shift.findById(shift._id)
      .populate("companyId", "name")
      .populate("employeeId", "name lastName email")
      .populate("payRateId", "rateType multiplier");

    res.status(200).json({ success: true, data: populatedShift });
  } catch (error) {
    console.error("Error updating shift:", error.message);
    res.status(500).json({
      success: false,
      message: "שגיאה בעדכון המשמרת: " + error.message,
    });
  }
};

// Remaining functions unchanged
export const getMyAllShifts = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { startDate, endDate } = req.query;
    const companyId = decodedToken.companyId;
    const employeeId = decodedToken.employeeId;

    const query = { companyId, employeeId };
    if (startDate || endDate) {
      query.shiftDate = {};
      if (startDate) query.shiftDate.$gte = new Date(startDate);
      if (endDate) query.shiftDate.$lte = new Date(endDate);
    }

    const shifts = await Shift.find(query)
      .populate("companyId", "name")
      .populate("employeeId", "name lastName email")
      .sort({ shiftDate: -1 });

    res.status(200).json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "שגיאה בשליפת המשמרות",
      error: error.message,
    });
  }
};

export const getAllShifts = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { employeeId, startDate, endDate } = req.query;
    const query = { companyId: decodedToken.companyId };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (startDate || endDate) {
      query.shiftDate = {};
      if (startDate) query.shiftDate.$gte = new Date(startDate);
      if (endDate) query.shiftDate.$lte = new Date(endDate);
    }

    const shifts = await Shift.find(query)
      .populate("companyId", "name")
      .populate("employeeId", "name lastName email")
      .sort({ shiftDate: -1 });

    res.status(200).json({ success: true, data: shifts });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "שגיאה בשליפת המשמרות",
      error: error.message,
    });
  }
};

export const getShiftById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { id } = req.params;
    const shift = await Shift.findById(id)
      .populate("companyId", "name")
      .populate("employeeId", "name lastName email");

    if (!shift || shift.companyId.toString() !== decodedToken.companyId) {
      return res.status(404).json({
        success: false,
        message: "המשמרת לא נמצאה או אינה שייכת לחברה זו",
      });
    }

    res.status(200).json({ success: true, data: shift });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "שגיאה בשליפת המשמרת",
      error: error.message,
    });
  }
};

export const deleteShift = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }

    const { id } = req.params;
    const shift = await Shift.findById(id);
    if (!shift || shift.companyId.toString() !== decodedToken.companyId) {
      return res.status(404).json({
        success: false,
        message: "המשמרת לא נמצאה או אינה שייכת לחברה זו",
      });
    }

    const employeeId = shift.employeeId;
    const hoursWorked = shift.hoursWorked || 0;
    const totalPay = shift.totalPay || 0;
    const shiftDate = shift.shiftDate;

    await Shift.findByIdAndDelete(id);

    const periodStart = new Date(
      shiftDate.getFullYear(),
      shiftDate.getMonth(),
      1
    );
    const periodEnd = new Date(
      shiftDate.getFullYear(),
      shiftDate.getMonth() + 1,
      0
    );

    let salary = await Salary.findOne({
      employeeId,
      periodStart,
      companyId: decodedToken.companyId,
    });

    if (salary) {
      salary.totalHours -= hoursWorked;
      salary.totalPay -= totalPay;
      salary.shifts = salary.shifts.filter(
        (shiftId) => shiftId.toString() !== id
      );
      salary.netPay = salary.totalPay;

      if (salary.shifts.length === 0) {
        await salary.deleteOne();
      } else {
        await salary.save();
      }
    }

    res.status(200).json({ success: true, message: "המשמרת נמחקה בהצלחה" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "שגיאה במחיקת המשמרת",
      error: error.message,
    });
  }
};
