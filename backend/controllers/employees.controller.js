import Employee from "../models/employees.model.js";
import SickDays from "../models/SickDays.models.js";
import Shift from "../models/shifts.model.js";
import PayRate from "../models/PayRates.model.js";
import Salary from "../models/Salary.model.js";
import Notification from "../models/notification.model.js";

import cron from "node-cron";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary, { uploadToCloudinary } from "../config/lib/cloudinary.js";
import vacationRules from "../config/vacation.json" with { type: "json" };

// Helper function to extract Cloudinary public ID from URL
export const extractPublicId = (url) => {
  const start = url.indexOf("/upload/") + 8;
  let publicIdWithExtension = url.substring(start);
  const versionRegex = /^v\d+\//;
  if (versionRegex.test(publicIdWithExtension)) {
    publicIdWithExtension = publicIdWithExtension.replace(versionRegex, "");
  }
  return publicIdWithExtension.replace(/\.[^/.]+$/, "");
};

// Create a new employee
export const createEmployee = async (req, res) => {
  const data = req.body;

  // Handle file upload
  let profileImageUrl = data.profileImageUrl || "";
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file);
      profileImageUrl = result.secure_url;
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error uploading profile image",
        error: error.message,
      });
    }
  }

  // Prepare employee data
  const employeeData = {
    companyId: data.companyId,
    name: data.name,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    identity: data.identity,
    email: data.email,
    password: await bcrypt.hash(data.password, 10),
    phone: data.phone,
    address: {
      city: data.address?.city,
      street: data.address?.street,
      country: data.address?.country,
      postalCode: data.address?.postalCode,
    },
    bankDetails: {
      accountNumber: data.bankDetails?.accountNumber || "",
      bankNumber: data.bankDetails?.bankNumber || "",
      branchCode: data.bankDetails?.branchCode || "",
    },
    role: data.role || "",
    department: data.department || null,
    paymentType: data.paymentType,
    hourlySalary: data.hourlySalary || null,
    globalSalary: data.globalSalary || null,
    expectedHours: data.expectedHours || null,
    profileImage: profileImageUrl,
    status: "active",
    vacationBalance: 0,
    vacationHistory: [],
    sickBalance: 0,
    sickHistory: [],
  };

  // Validate salary fields based on paymentType
  if (employeeData.paymentType === "Hourly") {
    if (employeeData.hourlySalary == null || employeeData.hourlySalary < 0) {
      return res.status(400).json({
        success: false,
        message: "hourlySalary is required and must be non-negative for Hourly payment type",
      });
    }
    employeeData.globalSalary = null;
    employeeData.expectedHours = null;
  } else if (employeeData.paymentType === "Global") {
    if (employeeData.globalSalary == null || employeeData.globalSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "globalSalary is required and must be non-negative for Global payment type",
      });
    }
    if (employeeData.expectedHours == null || employeeData.expectedHours < 0) {
      return res.status(400).json({
        success: false,
        message: "expectedHours is required and must be non-negative for Global payment type",
      });
    }
    employeeData.hourlySalary = null;
  } else if (employeeData.paymentType === "Commission-Based") {
    employeeData.hourlySalary = null;
    employeeData.globalSalary = null;
    employeeData.expectedHours = null;
  }

  try {
    const employee = new Employee(employeeData);
    await employee.save();
    const populatedEmployee = await Employee.findById(employee._id)
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("department", "name");

    res.status(201).json({ success: true, data: populatedEmployee });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating employee",
      error: error.message,
    });
  }
};

// Pull all employees
export const getAllEmployees = async (req, res) => {
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
    const employees = await Employee.find({ companyId })
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("department", "name");

    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving employees",
      error: error.message,
    });
  }
};

// Pull employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = decodedToken.employeeId;
    const employee = await Employee.findById(id)
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("department", "name");

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving employee",
      error: error.message,
    });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    // בדיקה ראשונית: הרשאות
    const token = req.cookies["auth_token"];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    jwt.verify(token, process.env.JWT_SECRET);

    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    // אם אין קובץ חדש ומתקבל מפתח profileImage, מוחקים אותו
    if (!req.file && "profileImage" in req.body) {
      delete req.body.profileImage;
    }

    const allowedUpdates = [
      "name",
      "lastName",
      "email",
      "gender",
      "identity",
      "phone",
      "role",
      "department",
      "paymentType",
      "hourlySalary",
      "globalSalary",
      "expectedHours",
      "status",
      "profileImage",
      "bankDetails.accountNumber",
      "bankDetails.bankNumber",
      "bankDetails.branchCode",
    ];

    // פריסת שדות address ו-bankDetails אם יש
    const flattened = {};
    for (const key of Object.keys(req.body)) {
      if (key === "address" && typeof req.body.address === "object") {
        for (const sub of Object.keys(req.body.address)) {
          flattened[`address.${sub}`] = req.body.address[sub];
        }
      } else if (key === "bankDetails" && typeof req.body.bankDetails === "object") {
        for (const sub of Object.keys(req.body.bankDetails)) {
          flattened[`bankDetails.${sub}`] = req.body.bankDetails[sub];
        }
      } else {
        flattened[key] = req.body[key];
      }
    }

    // טיפול בקובץ חדש
    if (req.file) {
      const employee = await Employee.findById(req.params.id);
      if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

      // מחיקת תמונה קודמת
      if (employee.profileImage) {
        const publicId = extractPublicId(employee.profileImage);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }

      // העלאת Buffer לתוך Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: "profile_images",
        resource_type: "image",
      });
      flattened.profileImage = uploadResult.secure_url;
    }

    // אימות מפתחות מותרות
    const keys = Object.keys(flattened);
    const valid = keys.every((k) => k.startsWith("address.") || k.startsWith("bankDetails.") || allowedUpdates.includes(k));
    if (!valid) {
      return res.status(400).json({ success: false, message: "Invalid update fields" });
    }

    // עדכון סיסמה אם קיים
    if (flattened.password) {
      flattened.password = await bcrypt.hash(flattened.password, 10);
    }

    // ביצוע העדכון
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: flattened },
      { new: true, runValidators: true }
    )
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("department", "name");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Error in updateEmployee:", err);
    return res.status(500).json({ success: false, message: "Error updating employee", error: err.message });
  }
};

export const addSickDay = async (req, res) => {
  try {
    const employeeId = req.params.id;
    console.log("employeeId:", employeeId);
    const { monthYear, days, country } = req.body;
    // monthYear חייב להיות מחרוזת בפורמט MM/YYYY
    if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(monthYear)) {
      return res.status(400).json({ success: false, message: "Invalid monthYear format" });
    }

    const employee = await Employee.findById(employeeId);
    console.log("employee:", employee);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // בדיקת כפילות לחודש הזה
    if (employee.sickHistory.some((entry) => entry.month === monthYear)) {
      return res.status(400).json({ success: false, message: "Sick day for this month already exists" });
    }

    // חישוב יתרה חדשה
    const newBalance = (employee.sickBalance || 0) + Number(days);

    // הוספת רשומה ל־sickHistory לפי הסכמה
    employee.sickHistory.push({
      month: monthYear,
      daysAdded: Number(days),
      newBalance,
      country,
      timestamp: new Date(),
    });

    // עדכון היתרה ב־root
    employee.sickBalance = newBalance;

    console.log("About to save:", {
      _id: employee._id,
      sickBalance: employee.sickBalance,
      lastHistoryEntry: employee.sickHistory.slice(-1)[0],
    });
    await employee.save();
    return res.status(200).json({ success: true, data: employee });
  } catch (err) {
    console.error("Error in addSickDay:", err);
    return res.status(500).json({ success: false, message: "Error adding sick day", error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    // 1) verify token & get employee ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.employeeId;
    if (!employeeId) return res.status(401).json({ success: false, message: "Invalid token" });

    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "All password fields are required." });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match." });
    }

    // 2) fetch user & compare current password
    const user = await Employee.findById(employeeId).select("+password");
    console.log("user:", user);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    // 3) hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ success: false, message: "Error changing password." });
  }
};

// Update employee vacation balance and history
export const updateEmployeeVacation = async (req, res) => {
  try {
    console.log("Received request to update vacation:", req.params.id, req.body);

    const token = req.cookies["auth_token"];
    if (!token) {
      console.error("No token provided");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      console.error("Invalid token");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { vacationBalance, vacationHistory } = req.body;
    console.log("Request body:", { vacationBalance, vacationHistory });

    // Validate inputs
    if (vacationBalance === null || vacationBalance === undefined || vacationBalance < 0) {
      console.error("Invalid vacationBalance:", vacationBalance);
      return res.status(400).json({
        success: false,
        message: "Vacation balance must be a non-negative number",
      });
    }
    if (!Array.isArray(vacationHistory)) {
      console.error("Invalid vacationHistory, not an array:", vacationHistory);
      return res.status(400).json({
        success: false,
        message: "Vacation history must be an array",
      });
    }

    // Validate vacationHistory entries
    for (const entry of vacationHistory) {
      if (
        !entry.month ||
        typeof entry.daysAdded !== "number" ||
        typeof entry.newBalance !== "number" ||
        !entry.country
      ) {
        console.error("Invalid vacationHistory entry:", entry);
        return res.status(400).json({
          success: false,
          message: "Each vacation history entry must have month, daysAdded, newBalance, and country",
        });
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        vacationBalance,
        vacationHistory,
      },
      { new: true, runValidators: true }
    )
      .select("name lastName address.country expectedHours vacationBalance vacationHistory createdAt")
      .populate("companyId", "name")
      .populate("projects.projectId", "name")
      .populate("department", "name");

    if (!employee) {
      console.error("Employee not found for ID:", req.params.id);
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    console.log("Updated employee:", employee);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error("Error in updateEmployeeVacation:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vacation balance",
      error: error.message,
    });
  }
};

// Soft delete employee by ID
export const deleteEmployee = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    employee.status = "deleted";
    employee.deletedAt = new Date();
    await employee.save();

    res.status(200).json({ success: true, message: "Employee soft deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error soft deleting employee",
      error: error.message,
    });
  }
};

export const addMonthlyVacationDays = async (companyId) => {
  try {
    console.log("Starting addMonthlyVacationDays for company:", companyId);

    const employees = await Employee.find({}).select(
      "name lastName address.country expectedHours vacationBalance vacationHistory createdAt"
    );
    console.log("Employees found:", employees.length);

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const monthYear = `${month}/${year}`;

    for (const employee of employees) {
      // בדיקה למניעת כפילויות
      const existingEntry = employee.vacationHistory.find((entry) => entry.month === monthYear);
      if (existingEntry) {
        console.log(`Skipping update for employee ${employee._id}, already updated for ${monthYear}`);
        continue;
      }

      const calculateSeniority = (createdAt) => {
        if (!createdAt) {
          console.warn("createdAt is undefined for employee:", employee._id);
          return 0;
        }
        const startDate = new Date(createdAt);
        const years = currentDate.getFullYear() - startDate.getFullYear();
        const months = currentDate.getMonth() - startDate.getMonth();
        return years + (months >= 0 ? 0 : -1);
      };

      const calculateJobPercentage = (expectedHours) => {
        const percentage = expectedHours ? Number(((expectedHours / 40) * 100).toFixed(2)) : 100;
        console.log(
          `Calculating job percentage for employee ${employee._id}: expectedHours=${expectedHours}, percentage=${percentage}`
        );
        return percentage;
      };

      const calculateAnnualVacationDays = () => {
        if (!employee.address || !employee.address.country) {
          console.error("Employee address or country is undefined:", employee._id);
          return 0;
        }

        const country = employee.address.country;
        const rules = vacationRules.countries[country] || vacationRules.countries["Custom"];
        if (!rules) {
          console.error(`No rules found for country: ${country}`);
          return 0;
        }

        console.log(`Rules for ${country}:`, rules);

        let annualDays = rules.baseDays || 0;

        const seniority = calculateSeniority(employee.createdAt);

        for (const rule of rules.seniorityRules || []) {
          if (rule.years && seniority >= rule.years) {
            if (rule.ageBased) {
              annualDays = rule.days || annualDays;
            } else {
              annualDays = rule.days || annualDays;
            }
          }
          if (rule.increment && seniority >= rule.years) {
            const extraYears = seniority - rule.years + 1;
            annualDays = Math.min(annualDays + extraYears * rule.increment, rule.maxDays || Infinity);
          }
        }

        console.log(`Calculated annual vacation days for employee ${employee._id}: ${annualDays}`);
        return Number(annualDays.toFixed(2));
      };

      const calculateMonthlyVacationDays = () => {
        const annualDays = calculateAnnualVacationDays();
        const jobPercentage = calculateJobPercentage(employee.expectedHours);
        const monthlyDays = (annualDays / 12) * (jobPercentage / 100);
        console.log(`Calculated monthly vacation days for employee ${employee._id}: ${monthlyDays}`);
        return Number(monthlyDays.toFixed(2));
      };

      const monthlyDays = calculateMonthlyVacationDays();
      const newBalance = Number((employee.vacationBalance + monthlyDays).toFixed(2));

      await Employee.findByIdAndUpdate(
        employee._id,
        {
          vacationBalance: newBalance,
          $push: {
            vacationHistory: {
              month: monthYear,
              daysAdded: monthlyDays,
              newBalance,
              country: employee.address.country,
              timestamp: new Date(),
            },
          },
        },
        { new: true, runValidators: true }
      );

      console.log(`Updated vacation for employee ${employee._id}: newBalance=${newBalance}`);
    }

    console.log(`Vacation days added for ${employees.length} employees for ${monthYear}`);
    return { success: true, message: `Vacation days added for ${monthYear}` };
  } catch (error) {
    console.error("Error in addMonthlyVacationDays:", error.message);
    throw new Error(`Failed to add monthly vacation days: ${error.message}`);
  }
};

cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly vacation update...");
  try {
    await addMonthlyVacationDays();
    console.log("Monthly vacation update completed");
  } catch (error) {
    console.error("Error in monthly vacation update:", error.message);
  }
});

export const triggerMonthlyVacationUpdate = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await addMonthlyVacationDays();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error triggering vacation update",
      error: error.message,
    });
  }
};

export const updateSickDays = async (req, res) => {
  try {
    const employees = await Employee.find(); // Only active employees
    let updatedCount = 0;
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
    const monthYear = `${month}/${year}`;
    for (const employee of employees) {
      const policy = await SickDays.findOne({ country: employee.address.country });
      if (!policy) continue;

      // Parse accrual_rate (e.g., "1.5 לחודש")
      const accrualRateMatch = policy.accrual_rate.match(/(\d+\.?\d*)/);
      if (!accrualRateMatch) continue; // Skip if accrual_rate is invalid
      const accrualRate = parseFloat(accrualRateMatch[0]);

      // Parse max_accrual (e.g., "90 ימים")
      const maxAccrualMatch = policy.max_accrual.match(/(\d+)/);
      const maxAccrual = maxAccrualMatch ? parseInt(maxAccrualMatch[0]) : Infinity;

      // Calculate new sick balance
      const newSickDays = Math.min(employee.sickBalance + accrualRate, maxAccrual);

      // Update sickHistory
      employee.sickHistory.push({
        month: monthYear,
        daysAdded: accrualRate,
        newBalance: newSickDays,
        country: employee.address.country,
        timestamp: currentDate,
      });

      // Update sickBalance
      employee.sickBalance = newSickDays;

      await employee.save();
      updatedCount++;
    }

    const message = `עודכנו ימי מחלה עבור ${updatedCount} עובדים`;
    if (res) {
      res.status(200).json({ message });
    } else {
      console.log(message);
    }
  } catch (error) {
    const errorMessage = "שגיאה בעדכון ימי מחלה: " + error.message;
    if (res) {
      res.status(500).json({ message: errorMessage });
    } else {
      console.error(errorMessage);
    }
  }
};

cron.schedule("0 0 1 * *", async () => {
  console.log("מריץ עדכון חודשי של ימי מחלה...");
  try {
    await updateSickDays();
    console.log("העדכון החודשי של ימי מחלה הושלם.");
  } catch (error) {
    console.error("שגיאה בעדכון ימי מחלה:", error.message);
  }
});

export const useSickDay = async (req, res) => {
  try {
    // 1. וידוא טוקן
    const token = req.cookies["auth_token"];
    if (!token) return res.status(401).json({ success: false, message: "לא מורשה" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ success: false, message: "טוקן לא תקין" });

    const employeeId = req.params.id;
    const { date, days } = req.body;

    // 2. ולידציה בסיסית
    if (!date || isNaN(Date.parse(date)))
      return res.status(400).json({ success: false, message: "תאריך חסר או לא תקין" });

    const usedDays = Number(days);
    if (isNaN(usedDays) || usedDays <= 0)
      return res.status(400).json({ success: false, message: "מספר ימים לא תקין" });

    // 3. שליפת העובד
    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ success: false, message: "עובד לא נמצא" });

    // 4. בדיקת חפיפה עם משמרות, ימי מחלה או חופשה
    const startDate = new Date(date);
    for (let i = 0; i < usedDays; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      const existingShift = await Shift.findOne({
        employeeId: employee._id,
        shiftDate: {
          $gte: new Date(checkDate.setHours(0, 0, 0, 0)),
          $lt: new Date(checkDate.setHours(23, 59, 59, 999)),
        },
      });
      if (existingShift) {
        return res.status(400).json({
          success: false,
          message: `לא ניתן להשתמש ביום מחלה בתאריך ${checkDate.toLocaleDateString()} עקב ${
            existingShift.dayType || "משמרת"
          } קיימת`,
        });
      }
    }

    // 5. שליפת מדיניות ימי מחלה
    const policy = await SickDays.findOne({ country: employee.address.country });
    if (!policy)
      return res.status(404).json({ success: false, message: "מדיניות ימי מחלה לא נמצאה עבור מדינת העובד" });

    // 6. שליפת תעריף רגיל
    const payRate = await PayRate.findOne({
      companyId: employee.companyId,
      rateType: "Regular",
      isActive: true,
    });
    if (!payRate)
      return res.status(404).json({ success: false, message: "תעריף רגיל לא מוגדר" });

    // 7. בדיקת יתרת ימי מחלה
    if (usedDays > (employee.sickBalance || 0))
      return res.status(400).json({ success: false, message: "יתרת ימי מחלה לא מספיקה" });

    // 8. עדכון יתרה והיסטוריה
    const newBalance = employee.sickBalance - usedDays;
    const monthYear = `${String(new Date(date).getMonth() + 1).padStart(2, "0")}/${new Date(date).getFullYear()}`;
    employee.sickHistory.push({
      month: monthYear,
      daysAdded: -usedDays,
      newBalance,
      country: employee.address.country,
      timestamp: new Date(date),
    });
    employee.sickBalance = newBalance;
    await employee.save();

    // 9. פרשנות paid_percentage ו-waiting_period
    const parts = policy.paid_percentage.split(",").map((p) => p.trim());
    const waitDays = parseInt((policy.waiting_period.match(/(\d+)/) || [0, 0])[1], 10);
    const rules = [];
    for (const part of parts) {
      const m1 = part.match(/(\d+)%.*?(\d+)-(\d+)/);
      const m2 = part.match(/.*יום(?:י)? (\d+) (\d+)%/);
      if (m1) rules.push({ from: +m1[2], to: +m1[3], pct: +m1[1] });
      else if (m2) rules.push({ from: +m2[1], to: Infinity, pct: +m2[2] });
    }
    rules.sort((a, b) => a.from - b.from);

    const dailyHours = payRate.hoursThreshold > 0 ? payRate.hoursThreshold : 8;
    const shifts = [];

    // 10. עיבוד כל יום מחלה
    for (let i = 1; i <= usedDays; i++) {
      if (i <= waitDays) continue;
      const rule = rules.find((r) => i >= r.from && i <= r.to);
      const pct = rule?.pct || 0;
      if (pct <= 0) continue;
      const multiplier = pct / 100;
      const dayDate = new Date(date);
      dayDate.setDate(dayDate.getDate() + i - 1);

      const gross = dailyHours * (employee.hourlySalary || 0) * multiplier;

      const periodStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), 1);
      const periodEnd = new Date(dayDate.getFullYear(), dayDate.getMonth() + 1, 0);
      let salary = await Salary.findOne({
        employeeId: employee._id,
        periodStart: { $lte: periodStart },
        periodEnd: { $gte: periodEnd },
      });

      if (!salary) {
        salary = new Salary({
          companyId: employee.companyId,
          employeeId: employee._id,
          periodStart,
          periodEnd,
          totalHours: dailyHours,
          totalPay: gross,
          netPay: gross,
        });
      } else {
        salary.totalHours += dailyHours;
        salary.totalPay += gross;
        salary.netPay += gross;
      }
      await salary.save();

      const shift = new Shift({
        companyId: employee.companyId,
        employeeId: employee._id,
        hoursWorked: dailyHours,
        hourlySalary: employee.hourlySalary || 0,
        shiftDate: dayDate,
        startTime: dayDate,
        endTime: new Date(dayDate.getTime() + dailyHours * 3600 * 1000),
        notes: `יום מחלה ${i}/${usedDays}`,
        shiftType: "Day",
        dayType: "Sickday",
        shiftBreakdown: [{ rateType: "Regular", hours: dailyHours, multiplier }],
      });
      shifts.push(await shift.save());
    }

    return res.status(200).json({ success: true, data: { employee, shiftsCreated: shifts.length, shifts } });
  } catch (err) {
    console.error("שגיאה ב-useSickDay:", err);
    return res.status(500).json({ success: false, message: "שגיאה בשימוש ביום מחלה", error: err.message });
  }
};

export const useVacationDay = async (req, res) => {
  try {
    // 1. וידוא טוקן
    const token = req.cookies["auth_token"];
    if (!token) return res.status(401).json({ success: false, message: "לא מורשה" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return res.status(401).json({ success: false, message: "טוקן לא תקין" });

    const employeeId = req.params.id;
    const { startDate, endDate, days } = req.body;
    // 2. ולידציה בסיסית
    if (!startDate || isNaN(Date.parse(startDate)) || !endDate || isNaN(Date.parse(endDate)))
      return res.status(400).json({ success: false, message: "תאריכים חסרים או לא תקינים" });

    const usedDays = Number(days);
    if (isNaN(usedDays) || usedDays <= 0)
    return res.status(400).json({ success: false, message: "מספר ימים לא תקין" });

    // 3. שליפת העובד
    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ success: false, message: "עובד לא נמצא" });

    // 4. בדיקת חפיפה עם משמרות, ימי מחלה או חופשה
    const start = new Date(startDate);
    for (let i = 0; i < usedDays; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(start.getDate() + i);
      const existingShift = await Shift.findOne({
        employeeId: employee._id,
        shiftDate: {
          $gte: new Date(checkDate.setHours(0, 0, 0, 0)),
          $lt: new Date(checkDate.setHours(23, 59, 59, 999)),
        },
      });
      if (existingShift) {
        return res.status(400).json({
          success: false,
          message: `לא ניתן להשתמש ביום חופשה בתאריך ${checkDate.toLocaleDateString()} עקב ${
            existingShift.dayType || "משמרת"
          } קיימת`,
        });
      }
    }

    // 5. בדיקת יתרת חופשה
    if (usedDays > (employee.vacationBalance || 0))
      return res.status(400).json({ success: false, message: "יתרת ימי חופשה לא מספיקה" });

    // 6. עדכון יתרה והיסטוריה
    const newBalance = employee.vacationBalance - usedDays;
    const monthYear = `${String(new Date(startDate).getMonth() + 1).padStart(2, "0")}/${new Date(
      startDate
    ).getFullYear()}`;
    employee.vacationHistory.push({
      month: monthYear,
      daysAdded: -usedDays,
      newBalance,
      country: employee.address.country,
      timestamp: new Date(startDate),
    });
    employee.vacationBalance = newBalance;
    await employee.save();

    // 7. שליפת שעות עבודה יומיות מתעריף רגיל
    const payRate = await PayRate.findOne({
      companyId: employee.companyId,
      rateType: "Regular",
      isActive: true,
    });
    if (!payRate)
      return res.status(404).json({ success: false, message: "תעריף רגיל לא מוגדר" });

    const dailyHours = payRate.hoursThreshold > 0 ? payRate.hoursThreshold : 8;
    const hourlySalary = employee.hourlySalary || 0;
    const grossPerDay = dailyHours * hourlySalary; // 100%

    // 8. עיבוד כל יום חופשה: יצירה/עדכון משכורת ומשמרת
    const shifts = [];
    for (let i = 0; i < usedDays; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);

      const periodStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), 1);
      const periodEnd = new Date(dayDate.getFullYear(), dayDate.getMonth() + 1, 0);

      let salary = await Salary.findOne({
        employeeId: employee._id,
        periodStart: { $lte: periodStart },
        periodEnd: { $gte: periodEnd },
      });
      if (!salary) {
        salary = new Salary({
          companyId: employee.companyId,
          employeeId: employee._id,
          periodStart,
          periodEnd,
          totalHours: dailyHours,
          totalPay: grossPerDay,
          netPay: grossPerDay,
        });
      } else {
        salary.totalHours += dailyHours;
        salary.totalPay += grossPerDay;
        salary.netPay += grossPerDay;
      }
      await salary.save();

      const shift = new Shift({
        companyId: employee.companyId,
        employeeId: employee._id,
        hoursWorked: dailyHours,
        hourlySalary,
        shiftDate: dayDate,
        startTime: dayDate,
        endTime: new Date(dayDate.getTime() + dailyHours * 3600 * 1000),
        notes: `יום חופשה ${i + 1}/${usedDays}`,
        shiftType: "Day",
        dayType: "Vacation",
        shiftBreakdown: [{ rateType: "Regular", hours: dailyHours, multiplier: 1 }],
      });
      shifts.push(await shift.save());
    }

    return res.status(200).json({
      success: true,
      data: {
        employee,
        shiftsCreated: shifts.length,
        shifts,
      },
    });
  } catch (err) {
    console.error("שגיאה ב-useVacationDay:", err);
    return res.status(500).json({
      success: false,
      message: "שגיאה בשימוש ביום חופשה",
      error: err.message,
    });
  }
};

export const checkEmployeeDetails = async () => {
  try {
    console.log("Starting checkEmployeeDetails...");

    const employees = await Employee.find().select(
      "name lastName email role department profileImage companyId bankDetails"
    );
    console.log(`Found ${employees.length} employees`);

    const missingDetails = [];

    // Check for missing details in each employee
    for (const employee of employees) {
      const issues = [];

      // Check for missing department only for non-admin employees
      if (employee.role !== "Admin" && !employee.department) {
        issues.push("מחלקה חסרה");
      }

      // Check for missing bank details
      if (!employee.role) issues.push(" תפקיד חסר ");
      if (!employee.bankDetails?.accountNumber) issues.push("מספר חשבון בנק חסר");
      if (!employee.bankDetails?.bankNumber) issues.push("מספר בנק חסר");
      if (!employee.bankDetails?.branchCode) issues.push("קוד סניף חסר");

      if (issues.length > 0) {
        missingDetails.push({
          employeeId: employee._id.toString(),
          employeeName: `${employee.name || "Unknown"} ${employee.lastName || ""}`,
          companyId: employee.companyId,
          issues,
        });
      }
    }

    // Send a single notification per employee to admins
    for (const detail of missingDetails) {
      const admins = await Employee.find({
        companyId: detail.companyId,
        role: "Admin",
        status: "active",
      }).select("_id");

      if (admins.length === 0) {
        console.warn(`No active admins found for company ${detail.companyId}`);
        continue;
      }

      // Create a message with the employee ID explicitly included
      const message = `לעובד ${detail.employeeName} (מזהה: ${detail.employeeId}) חסרים הפרטים הבאים: ${detail.issues.join(
        ", "
      )}`;

      // Create a notification for each admin
      for (const admin of admins) {
        const notification = new Notification({
          companyId: detail.companyId,
          content: message,
          type: "Warning",
          employeeId: admin._id,
          PurchaseOrder: "details",
          isRead: false,
        });

        await notification.save();
        console.log(`Notification sent to admin ${admin._id}: ${message}`);
      }
    }

    console.log(`Check completed. Found ${missingDetails.length} employees with missing details`);
    return {
      success: true,
      message: `Checked ${employees.length} employees, found ${missingDetails.length} with missing details`,
      details: missingDetails,
    };
  } catch (error) {
    console.error("Error in checkEmployeeDetails:", error.message);
    throw new Error(`Failed to check employee details: ${error.message}`);
  }
};

// Schedule the check every hours
cron.schedule("0 * * * *", async () => {
  console.log("Running scheduled employee details check...");
  try {
    await checkEmployeeDetails();
    console.log("Employee details check completed");
  } catch (error) {
    console.error("Error in scheduled employee details check:", error.message);
  }
});

// API endpoint to manually trigger the check
export const triggerEmployeeDetailsCheck = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "לא מורשה" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "טוקן לא תקין" });
    }

    const result = await checkEmployeeDetails();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "שגיאה בבדיקת פרטי עובדים",
      error: error.message,
    });
  }
};