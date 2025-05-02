import Salary from "../models/salary.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Create a new salary
export const createSalary = async (req, res) => {
  const {
    periodStart,
    periodEnd,
    totalHours,
    totalPay,
    taxDeduction,
    bonus,
    otherDeductions,
    netPay,
    notes,
    status,
  } = req.body;

  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const companyId = decodedToken.companyId;
  const employeeId = decodedToken.employeeId;

  const salaryData = {
    companyId: companyId,
    employeeId: employeeId,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    totalHours,
    totalPay,
    bonus,
    taxDeduction,
    otherDeductions,
    netPay,
    notes,
    status,
  };

  const salary = await Salary.create(salaryData);
  res.status(201).json({ data: salary, message: "משכורת נוצרה בהצלחה" });
};

// Get all salaries (filtered by company)
export const getAllSalaries = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const companyId = decodedToken.companyId;
  const salaries = await Salary.find({ companyId }).populate(
    "employeeId",
    "name lastName"
  );
  res.json({ data: salaries });
};

// Get a single salary by ID
export const getSalaryById = async (req, res) => {
  const salary = await Salary.findById(req.params.id).populate(
    "employeeId",
    "name lastName"
  );

  if (!salary) {
    res.status(404);
    throw new Error("משכורת לא נמצאה");
  }

  if (salary.companyId.toString() !== req.user?.companyId) {
    res.status(403);
    throw new Error("אין הרשאה לגשת למשכורת זו");
  }

  res.json({ data: salary });
};

// Get logged-in user's salaries
export const getMySalaries = async (req, res) => {
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const employeeId = decodedToken.employeeId;

  const salaries = await Salary.find({ employeeId }).populate(
    "employeeId",
    "name lastName"
  );
  res.json({ data: salaries });
};

// Update a salary
export const updateSalary = async (req, res) => {
  const salary = await Salary.findById(req.params.id);

  if (!salary) {
    res.status(404);
    throw new Error("משכורת לא נמצאה");
  }

  const {
    employeeId,
    periodStart,
    periodEnd,
    totalHours,
    totalPay,
    bonus,
    taxDeduction,
    otherDeductions,
    netPay,
    notes,
    status,
  } = req.body;

  // Validate employeeId before creating ObjectId
  salary.employeeId =
    employeeId && mongoose.Types.ObjectId.isValid(employeeId)
      ? new mongoose.Types.ObjectId(employeeId)
      : salary.employeeId;
  salary.periodStart = periodStart ? new Date(periodStart) : salary.periodStart;
  salary.periodEnd = periodEnd ? new Date(periodEnd) : salary.periodEnd;
  salary.totalHours = totalHours ?? salary.totalHours;
  salary.totalPay = totalPay ?? salary.totalPay;
  salary.netPay = netPay ?? salary.netPay;

  // Bonus logic
  if (salary.bonus === 0 && bonus > 0) {
    salary.bonus = bonus;
    salary.totalPay = parseFloat(salary.totalPay) + parseFloat(bonus);
    salary.netPay = parseFloat(salary.netPay) + parseFloat(bonus);
  } else if (salary.bonus > 0 && salary.bonus < bonus) {
    const diff = parseFloat(bonus) - parseFloat(salary.bonus);
    salary.bonus = bonus;
    salary.totalPay = parseFloat(salary.totalPay) + diff;
    salary.netPay = parseFloat(salary.netPay) + diff;
  } else if (salary.bonus > 0 && salary.bonus > bonus) {
    const diff = parseFloat(salary.bonus) - parseFloat(bonus);
    salary.bonus = bonus;
    salary.totalPay = parseFloat(salary.totalPay) - diff;
    salary.netPay = parseFloat(salary.netPay) - diff;
  }

  salary.taxDeduction = taxDeduction ?? salary.taxDeduction;
  salary.otherDeductions = otherDeductions ?? salary.otherDeductions;
  salary.notes = notes ?? salary.notes;
  salary.status = status ?? salary.status;

  console.log(salary);
  const updatedSalary = await salary.save();
  res.json({ data: updatedSalary, message: "משכורת עודכנה בהצלחה" });
};
// Delete a salary
export const deleteSalary = async (req, res) => {
  const salary = await Salary.findById(req.params.id);

  if (!salary) {
    res.status(404);
    throw new Error("משכורת לא נמצאה");
  }

  if (salary.companyId.toString() !== req.user?.companyId) {
    res.status(403);
    throw new Error("אין הרשאה למחוק משכורת זו");
  }

  await salary.deleteOne();
  res.json({ message: "משכורת נמחקה בהצלחה" });
};
