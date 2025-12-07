import Salary from "../models/Salary.model.js";
import TaxConfig from "../models/TaxConfig.model.js";
import Employee from "../models/employees.model.js";
import Company from "../models/companies.model.js";
import Shift from "../models/Shifts.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { transporter } from "../config/lib/nodemailer.js";

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
  const salaries = await Salary.find({ companyId })
    .populate(
      "employeeId",
      "name lastName email phone identity vacationBalance sickBalance vacationHistory sickHistory dateOfBirth createdAt address bankDetails role department hourlySalary globalSalary expectedHours paymentType"
    )
    .populate({
      path: "employeeId",
      populate: {
        path: "department",
        select: "name"
      }
    })
    .populate(
      "companyId",
      "name email phone address taxId"
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

// Send payslip emails to all employees for a specific month
export const sendPayslipEmails = async (req, res) => {
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
    const { year, month } = req.body;

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

    // Define the date range for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Fetch all salaries for the month and company with populated employee and company data
    const salaries = await Salary.find({
      companyId,
      periodStart: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate(
        "employeeId",
        "name lastName email phone identity vacationBalance sickBalance vacationHistory sickHistory dateOfBirth createdAt address bankDetails role department hourlySalary globalSalary expectedHours paymentType"
      )
      .populate({
        path: "employeeId",
        populate: {
          path: "department",
          select: "name"
        }
      })
      .populate(
        "companyId",
        "name email phone address taxId"
      );

    if (!salaries.length) {
      return res.status(404).json({
        success: false,
        message: "No salaries found for this month",
      });
    }

    // Get company info
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const results = {
      sent: [],
      failed: [],
    };

    // Process each salary and send email
    for (const salary of salaries) {
      try {
        const employeeData = salary.employeeId;
        if (!employeeData || !employeeData.email) {
          results.failed.push({
            salaryId: salary._id,
            reason: "Employee email not found",
          });
          continue;
        }

        // Generate payslip HTML (similar to frontend logic)
        const payslipHtml = await generatePayslipHTML(salary, employeeData, company);

        // Send email
        const emailData = {
          from: process.env.EMAIL_USER,
          to: employeeData.email,
          subject: `תלוש שכר - ${company.name} - ${month}/${year}`,
          html: `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
              <h2>שלום ${employeeData.name} ${employeeData.lastName || ""},</h2>
              <p>מצורף תלוש השכר שלך לחודש ${month}/${year}.</p>
              <p>בברכה,<br>${company.name}</p>
              <hr>
              ${payslipHtml}
            </div>
          `,
        };

        await transporter.sendMail(emailData);
        results.sent.push({
          salaryId: salary._id,
          employeeEmail: employeeData.email,
        });
      } catch (error) {
        console.error(`Error sending email for salary ${salary._id}:`, error);
        results.failed.push({
          salaryId: salary._id,
          reason: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Sent ${results.sent.length} payslips, ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    console.error("Error sending payslip emails:", error.message);
    res.status(500).json({
      success: false,
      message: "Error sending payslip emails: " + error.message,
    });
  }
};

// Helper function to generate payslip HTML
async function generatePayslipHTML(salary, employeeData, company) {
  const isRTL = true; // Default to Hebrew
  const currentLang = "he";

  // Get employee data
  const employeeName = employeeData.name || "N/A";
  const employeeLastName = employeeData.lastName || "";
  const fullEmployeeName = employeeLastName ? `${employeeName} ${employeeLastName}` : employeeName;
  const employeeId = employeeData.identity || (employeeData._id ? employeeData._id.toString().slice(-6) : "N/A");
  const employeeEmail = employeeData.email || "N/A";
  const employeePhone = employeeData.phone || "N/A";

  // Get company information
  const companyName = company.name || "Company Name";
  const companyAddress = company.address ? `${company.address.street || ""}, ${company.address.city || ""} ${company.address.postalCode || ""}`.trim() : "";
  const companyPhone = company.phone || "";
  const companyEmail = company.email || "";
  const companyTaxId = company.taxId || "";

  const payslipId = salary._id ? salary._id.toString().slice(-6) : "000000";

  // Get employee additional data
  const employeeDateOfBirth = employeeData.dateOfBirth ? new Date(employeeData.dateOfBirth).toLocaleDateString("he-IL") : "N/A";
  const employeeStartDate = employeeData.createdAt ? new Date(employeeData.createdAt).toLocaleDateString("he-IL") : "N/A";
  const employeeRole = employeeData.role || "N/A";
  const employeeDepartment = employeeData.department?.name || "N/A";
  const employeeAddress = employeeData.address ? `${employeeData.address.street || ""}, ${employeeData.address.city || ""} ${employeeData.address.postalCode || ""}`.trim() : "N/A";

  // Get bank details
  const bankAccount = employeeData.bankDetails?.accountNumber || "N/A";
  const bankNumber = employeeData.bankDetails?.bankNumber || "N/A";
  const branchCode = employeeData.bankDetails?.branchCode || "N/A";

  // Calculate base salary
  const hourlySalary = parseFloat(employeeData.hourlySalary || 0);
  const globalSalary = parseFloat(employeeData.globalSalary || 0);
  const expectedHours = parseFloat(employeeData.expectedHours || 0);
  const paymentType = employeeData.paymentType || "Global";

  let baseSalary = 0;
  if (paymentType === "Global") {
    baseSalary = globalSalary;
  } else if (paymentType === "Hourly") {
    baseSalary = hourlySalary * expectedHours;
  }

  // Fetch shifts data for detailed hours breakdown
  let baseSalaryAmount = 0;
  let overtimeAmount = 0;
  let vacationDaysAmount = 0;
  let sickDaysAmount = 0;
  let workDays = 0;
  let vacationDays = 0;
  let sickDays = 0;
  let regularHours = 0;
  let overtimeHours = 0;

  try {
    const startDateStr = new Date(salary.periodStart).toISOString().split('T')[0];
    const endDateStr = new Date(salary.periodEnd).toISOString().split('T')[0];
    const shifts = await Shift.find({
      employeeId: employeeData._id,
      shiftDate: {
        $gte: new Date(startDateStr),
        $lte: new Date(endDateStr),
      },
    });

    shifts.forEach(shift => {
      const shiftPay = parseFloat(shift.totalPay || 0);
      const shiftHours = parseFloat(shift.hoursWorked || 0);

      // Calculate payment by day type
      if (shift.dayType === "Regular") {
        workDays++;
        // Calculate regular vs overtime from breakdown
        if (shift.shiftBreakdown && Array.isArray(shift.shiftBreakdown)) {
          shift.shiftBreakdown.forEach(breakdown => {
            const hours = parseFloat(breakdown.hours || 0);
            if (breakdown.rateType === "Regular") {
              regularHours += hours;
              baseSalaryAmount += hours * hourlySalary;
            } else if (breakdown.rateType === "Overtime125" || breakdown.rateType === "Overtime150") {
              overtimeHours += hours;
              overtimeAmount += hours * hourlySalary * parseFloat(breakdown.multiplier || 1.25);
            }
          });
        } else {
          // Fallback: use shift totalPay
          const regular = Math.max(0, shiftHours - parseFloat(shift.overtimeHours || 0));
          regularHours += regular;
          overtimeHours += parseFloat(shift.overtimeHours || 0);
          baseSalaryAmount += regular * hourlySalary;
          overtimeAmount += parseFloat(shift.overtimeHours || 0) * hourlySalary * 1.25;
        }
      } else if (shift.dayType === "Vacation") {
        vacationDays++;
        vacationDaysAmount += shiftPay;
      } else if (shift.dayType === "Sickday") {
        sickDays++;
        sickDaysAmount += shiftPay;
      }
    });
  } catch (err) {
    console.error("Error fetching shifts:", err);
  }

  // If no base salary calculated from shifts, use globalSalary or calculate from base
  if (baseSalaryAmount === 0 && workDays === 0) {
    if (paymentType === "Global") {
      baseSalaryAmount = globalSalary;
    } else if (paymentType === "Hourly" && expectedHours > 0) {
      baseSalaryAmount = hourlySalary * expectedHours;
    } else {
      baseSalaryAmount = baseSalary;
    }
  }

  // If baseSalaryAmount is still 0, use the calculated baseSalary
  if (baseSalaryAmount === 0) {
    baseSalaryAmount = baseSalary;
  }

  // Get salary data
  const totalPay = parseFloat(salary.totalPay || 0);
  const bonus = parseFloat(salary.bonus || 0);
  const taxDeduction = parseFloat(salary.taxDeduction || 0);
  const netPay = parseFloat(salary.netPay || 0);

  // Calculate total gross from all components
  const calculatedGross = baseSalaryAmount + overtimeAmount + vacationDaysAmount + sickDaysAmount + bonus;
  const finalGross = calculatedGross > 0 ? calculatedGross : totalPay;

  // Get vacation and sick leave data
  const vacationBalance = parseFloat(employeeData.vacationBalance || 0);
  const sickBalance = parseFloat(employeeData.sickBalance || 0);

  // Calculate monthly changes for current period
  const periodMonth = new Date(salary.periodStart).getMonth() + 1;
  const periodYear = new Date(salary.periodStart).getFullYear();
  const periodMonthYear = `${String(periodMonth).padStart(2, '0')}/${periodYear}`;

  // Find vacation history for this month
  let vacationAdded = 0;
  let vacationUsed = 0;
  if (employeeData.vacationHistory && Array.isArray(employeeData.vacationHistory)) {
    const monthHistory = employeeData.vacationHistory.filter(h => h.month === periodMonthYear);
    monthHistory.forEach(h => {
      if (h.daysAdded > 0) {
        vacationAdded += h.daysAdded;
      } else {
        vacationUsed += Math.abs(h.daysAdded);
      }
    });
  }

  // Find sick leave history for this month
  let sickAdded = 0;
  let sickUsed = 0;
  if (employeeData.sickHistory && Array.isArray(employeeData.sickHistory)) {
    const monthHistory = employeeData.sickHistory.filter(h => h.month === periodMonthYear);
    monthHistory.forEach(h => {
      if (h.daysAdded > 0) {
        sickAdded += h.daysAdded;
      } else {
        sickUsed += Math.abs(h.daysAdded);
      }
    });
  }

  const vacationRemaining = vacationBalance;
  const sickRemaining = sickBalance;

  // Calculate total deductions
  let totalDeductions = taxDeduction;
  const otherDeductionsList = [];
  if (salary.otherDeductions && salary.otherDeductions.length > 0) {
    salary.otherDeductions.forEach((deduction) => {
      const amount = parseFloat(deduction.amount || 0);
      if (amount > 0) {
        totalDeductions += amount;
        otherDeductionsList.push({
          desc: deduction.description || "ניכוי אחר",
          amount: amount,
        });
      }
    });
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Generate HTML (simplified version for email)
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Assistant', 'Arial', sans-serif;
          direction: rtl;
          padding: 20px;
          background: white;
          color: #1e293b;
        }
        .payslip-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          position: relative;
        }
        .company-name {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .payslip-title {
          font-size: 18px;
          opacity: 0.9;
        }
        .badge {
          position: absolute;
          left: 20px;
          top: 20px;
          background: white;
          padding: 12px 16px;
          border-radius: 6px;
          color: #2563eb;
          text-align: center;
        }
        .section {
          margin: 20px 0;
        }
        .info-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 12px;
        }
        .info-item {
          font-size: 12px;
        }
        .info-label {
          font-weight: 600;
          color: #64748b;
          margin-bottom: 4px;
        }
        .info-value {
          color: #1e293b;
          font-weight: 500;
        }
        .period-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px 20px;
          text-align: right;
          font-weight: 600;
        }
        .earnings-section {
          margin: -106px 0 24px 0;
        }
        .section-header {
          background: #ef4444;
          color: white;
          padding: 12px 20px;
          border-radius: 6px 6px 0 0;
          font-weight: 700;
          font-size: 14px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          border-top: none;
        }
        .table thead {
          background: #f8fafc;
        }
        .table th {
          padding: 10px 16px;
          text-align: right;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }
        .table td {
          padding: 10px 16px;
          text-align: right;
          font-size: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .amount {
          font-weight: 700;
          color: #059669;
        }
        .deduction-amount {
          font-weight: 700;
          color: #ef4444;
        }
        .total-row {
          background: #fef2f2;
          font-weight: 700;
        }
        .total-row td {
          padding: 12px 16px;
          border-top: 2px solid #ef4444;
          border-bottom: 2px solid #ef4444;
        }
        .net-pay {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          text-align: right;
        }
        .net-pay-amount {
          font-size: 32px;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="payslip-container">
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="payslip-title">תלוש שכר</div>
          <div class="badge">
            <div style="font-size: 10px; font-weight: 600; margin-bottom: 4px;">מספר תלוש</div>
            <div style="font-size: 14px; font-weight: 700;">SL-${payslipId}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="info-box" style="background: #f8fafc;">
            <div class="section-title">פרטי חברה</div>
            <div class="info-row">
              <div class="info-item">
                <div class="info-label">שם חברה</div>
                <div class="info-value">${companyName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">ח.פ./מס ערך מוסף</div>
                <div class="info-value">${companyTaxId || 'N/A'}</div>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <div class="info-label">כתובת</div>
                <div class="info-value">${companyAddress || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">טלפון</div>
                <div class="info-value">${companyPhone || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="info-box">
            <div class="section-title">פרטי עובד</div>
            <div class="info-row">
              <div class="info-item">
                <div class="info-label">שם</div>
                <div class="info-value">${fullEmployeeName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">ת.ז.</div>
                <div class="info-value">${employeeId}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="period-box">
            תקופת שכר: ${formatDate(salary.periodStart)} - ${formatDate(salary.periodEnd)}
          </div>
        </div>
        
        <div class="earnings-section">
          <div class="section-header">הכנסות</div>
          <table class="table">
            <thead>
              <tr>
                <th>תיאור</th>
                <th style="text-align: left">כמות</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>שכר בסיס</td>
                <td style="text-align: left" class="amount">${baseSalaryAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
              ${overtimeAmount > 0 ? `
              <tr>
                <td>שעות נוספות (${overtimeHours.toFixed(2)}h)</td>
                <td style="text-align: left" class="amount">${overtimeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
              ` : ''}
              ${sickDaysAmount > 0 ? `
              <tr>
                <td>ימי מחלה (${sickDays} ימים)</td>
                <td style="text-align: left" class="amount">${sickDaysAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
              ` : ''}
              ${vacationDaysAmount > 0 ? `
              <tr>
                <td>ימי חופש (${vacationDays} ימים)</td>
                <td style="text-align: left" class="amount">${vacationDaysAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
              ` : ''}
              ${bonus > 0 ? `
              <tr>
                <td>בונוס</td>
                <td style="text-align: left" class="amount">${bonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>שכר ברוטו</td>
                <td style="text-align: left" class="amount">${finalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <div class="section-header" style="background: #ef4444;">ניכויים</div>
          <table class="table">
            <thead>
              <tr>
                <th>תיאור</th>
                <th style="text-align: left">סכום</th>
              </tr>
            </thead>
            <tbody>
              ${taxDeduction > 0 ? `
              <tr>
                <td>מס הכנסה</td>
                <td style="text-align: left" class="deduction-amount">-${taxDeduction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
              ` : ''}
              ${otherDeductionsList.map(d => `
              <tr>
                <td>${d.desc}</td>
                <td style="text-align: left" class="deduction-amount">-${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
              `).join('')}
              <tr class="total-row">
                <td>סה"כ ניכויים</td>
                <td style="text-align: left" class="deduction-amount">-${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="net-pay">
          <div style="font-size: 12px; font-weight: 600; opacity: 0.9; margin-bottom: 8px;">משכורת נטו</div>
          <div class="net-pay-amount">${netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
