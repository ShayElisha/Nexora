import Salary from "../models/salary.model.js";
import TaxConfig from "../models/TaxConfig.model.js";
import Employee from "../models/employees.model.js";
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

  // Bonus logic
  if (salary.bonus === 0 && bonus > 0) {
    salary.bonus = bonus;
  } else if (salary.bonus > 0 && salary.bonus < bonus) {
    salary.bonus = bonus;
  } else if (salary.bonus > 0 && salary.bonus > bonus) {
    salary.bonus = bonus;
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

export const calculateAndUpdateSalaryTaxes = async (req, res) => {
  try {
    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken.companyId;
    const {
      employeeId,
      periodStart,
      periodEnd,
      totalHours,
      totalPay,
      bonus = 0,
      notes,
      status = "Draft",
    } = req.body;

    // Validate required fields
    if (!employeeId || !periodStart || !periodEnd || !totalHours || !totalPay) {
      return res.status(400).json({
        success: false,
        message:
          "employeeId, periodStart, periodEnd, totalHours, and totalPay are required",
      });
    }

    // Validate employeeId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employeeId",
      });
    }

    // Fetch employee to get countryCode
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.companyId.toString() !== companyId) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or does not belong to this company",
      });
    }

    // Fetch TaxConfig
    const countryCode = employee.countryCode || "IL";
    const taxConfig = await TaxConfig.findOne({
      countryCode,
      companyId,
      isActive: true,
    });
    if (!taxConfig) {
      return res.status(404).json({
        success: false,
        message: `No tax configuration found for country ${countryCode}`,
      });
    }

    // Calculate income tax based on taxBrackets
    const taxableIncome = Number(totalPay); // Include bonus in taxable income
    let taxDeduction = 0;
    let previousLimit = 0;

    for (const bracket of taxConfig.taxBrackets.sort(
      (a, b) => a.limit - b.limit
    )) {
      if (taxableIncome > previousLimit) {
        const taxableInBracket =
          Math.min(taxableIncome, bracket.limit) - previousLimit;
        if (taxableInBracket > 0) {
          taxDeduction += taxableInBracket * bracket.rate;
        }
      }
      previousLimit = bracket.limit;
    }

    // Prepare other deductions (excluding income tax)
    const otherDeductions = [];
    taxConfig.otherTaxes.forEach((tax) => {
      const amount = tax.fixedAmount || taxableIncome * tax.rate;
      if (amount > 0) {
        otherDeductions.push({
          description: tax.name,
          amount: amount.toFixed(2),
        });
      }
    });

    // Calculate netPay
    const totalOtherDeductions = otherDeductions.reduce(
      (sum, d) => sum + Number(d.amount) + Number(bonus),
      0
    );
    const netPay = (
      taxableIncome -
      taxDeduction -
      totalOtherDeductions
    ).toFixed(2);

    // Check if salary exists for the employee and period
    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);
    let salary = await Salary.findOne({
      employeeId,
      periodStart: {
        $gte: new Date(
          periodStartDate.getFullYear(),
          periodStartDate.getMonth(),
          1
        ),
        $lte: new Date(
          periodStartDate.getFullYear(),
          periodStartDate.getMonth() + 1,
          0
        ),
      },
      companyId,
    });

    if (salary) {
      // Update existing salary
      salary.totalHours = totalHours;
      salary.totalPay = totalPay;
      salary.bonus = bonus;
      salary.taxDeduction = taxDeduction.toFixed(2);
      salary.otherDeductions = otherDeductions;
      salary.netPay = netPay;
      salary.notes = notes || salary.notes;
      salary.status = status;
      salary.periodEnd = periodEndDate;
    } else {
      // Create new salary
      salary = new Salary({
        companyId,
        employeeId,
        periodStart: periodStartDate,
        periodEnd: periodEndDate,
        totalHours,
        totalPay,
        bonus,
        taxDeduction: taxDeduction.toFixed(2),
        otherDeductions,
        netPay,
        notes,
        status,
      });
    }

    const updatedSalary = await salary.save();

    res.status(200).json({
      success: true,
      data: updatedSalary,
      message: "Salary and taxes updated successfully",
    });
  } catch (error) {
    console.error(
      "Error calculating and updating salary taxes:",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "Error calculating and updating taxes: " + error.message,
    });
  }
};

export const calculateTaxesForMonthWithTax = async (req, res) => {
  try {
    // Validate token
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const companyId = decodedToken.companyId;
    const { year, month, taxConfigId } = req.body;

    // Validate inputs
    if (
      !year ||
      !month ||
      isNaN(year) ||
      isNaN(month) ||
      month < 1 ||
      month > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "year and month must be valid (e.g., year: 2025, month: 5)",
      });
    }
    if (!taxConfigId || !mongoose.Types.ObjectId.isValid(taxConfigId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid taxConfigId",
      });
    }

    // Fetch TaxConfig
    const taxConfig = await TaxConfig.findOne({ _id: taxConfigId, companyId });
    if (!taxConfig) {
      return res.status(404).json({
        success: false,
        message:
          "Tax configuration not found or does not belong to this company",
      });
    }

    // Define the date range for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Fetch all salaries for the month and company
    const salaries = await Salary.find({
      companyId,
      periodStart: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    if (!salaries.length) {
      return res.status(404).json({
        success: false,
        message: "No salaries found for this month",
      });
    }

    // Process each salary
    const updatedSalaries = [];
    for (const salary of salaries) {
      // Calculate income tax based on taxBrackets
      const taxableIncome = Number(salary.totalPay) + Number(salary.bonus); // Include bonus
      let taxDeduction = 0;
      let previousLimit = 0;

      for (const bracket of taxConfig.taxBrackets.sort(
        (a, b) => a.limit - b.limit
      )) {
        if (taxableIncome > previousLimit) {
          const taxableInBracket =
            Math.min(taxableIncome, bracket.limit) - previousLimit;
          if (taxableInBracket > 0) {
            taxDeduction += taxableInBracket * bracket.rate;
          }
        }
        previousLimit = bracket.limit;
      }

      // Prepare other deductions (excluding income tax)
      const otherDeductions = [];
      taxConfig.otherTaxes.forEach((tax) => {
        const amount = tax.fixedAmount || taxableIncome * tax.rate;
        if (amount > 0) {
          otherDeductions.push({
            description: tax.name,
            amount: amount.toFixed(2),
          });
        }
      });

      // Calculate netPay
      const totalOtherDeductions = otherDeductions.reduce(
        (sum, d) => sum + Number(d.amount),
        0
      );
      const netPay = (
        taxableIncome -
        taxDeduction -
        totalOtherDeductions
      ).toFixed(2);

      // Update salary
      salary.taxDeduction = taxDeduction.toFixed(2);
      salary.otherDeductions = otherDeductions;
      salary.netPay = netPay;

      const updatedSalary = await salary.save();
      updatedSalaries.push(updatedSalary);
    }

    res.status(200).json({
      success: true,
      data: updatedSalaries,
      message: `Taxes updated successfully for ${updatedSalaries.length} salaries`,
    });
  } catch (error) {
    console.error("Error calculating taxes for month:", error.message);
    res.status(500).json({
      success: false,
      message: "Error calculating taxes for month: " + error.message,
    });
  }
};
