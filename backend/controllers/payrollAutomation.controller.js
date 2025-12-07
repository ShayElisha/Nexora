import Salary from "../models/Salary.model.js";
import Employee from "../models/employees.model.js";
import Shift from "../models/Shifts.model.js";
import TaxConfig from "../models/TaxConfig.model.js";
import Company from "../models/companies.model.js";
import Finance from "../models/finance.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Get automation settings
export const getAutomationSettings = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    // Return settings from database or defaults
    const settings = company.payrollAutomationSettings || {
      enabled: false,
      calculationDate: 25,
      approvalDate: 27,
      paymentDate: 1,
      autoApprove: false,
      autoSendPayslips: true,
      notificationDays: 3,
      nextMonthApprovalDate: null,
      defaultTaxConfigId: null,
    };

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update automation settings
export const updateAutomationSettings = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { enabled, calculationDate, approvalDate, paymentDate, autoApprove, autoSendPayslips, notificationDays, nextMonthApprovalDate, defaultTaxConfigId } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    // Validate defaultTaxConfigId if provided
    if (defaultTaxConfigId && !mongoose.Types.ObjectId.isValid(defaultTaxConfigId)) {
      return res.status(400).json({ success: false, message: "Invalid tax config ID" });
    }

    // Update settings
    company.payrollAutomationSettings = {
      enabled: enabled !== undefined ? enabled : (company.payrollAutomationSettings?.enabled || false),
      calculationDate: calculationDate || company.payrollAutomationSettings?.calculationDate || 25,
      approvalDate: approvalDate || company.payrollAutomationSettings?.approvalDate || 27,
      paymentDate: paymentDate || company.payrollAutomationSettings?.paymentDate || 1,
      autoApprove: autoApprove !== undefined ? autoApprove : (company.payrollAutomationSettings?.autoApprove || false),
      autoSendPayslips: autoSendPayslips !== undefined ? autoSendPayslips : (company.payrollAutomationSettings?.autoSendPayslips !== undefined ? company.payrollAutomationSettings.autoSendPayslips : true),
      notificationDays: notificationDays || company.payrollAutomationSettings?.notificationDays || 3,
      nextMonthApprovalDate: nextMonthApprovalDate ? new Date(nextMonthApprovalDate) : company.payrollAutomationSettings?.nextMonthApprovalDate,
      defaultTaxConfigId: defaultTaxConfigId || company.payrollAutomationSettings?.defaultTaxConfigId || null,
    };

    await company.save();

    res.json({ success: true, data: company.payrollAutomationSettings, message: "הגדרות נשמרו בהצלחה" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Calculate salaries for a month
export const calculateSalariesForMonth = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { year, month } = req.body;

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "שנה וחודש חובה",
      });
    }

    // Calculate period dates
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    // Get all active employees
    const employees = await Employee.find({
      companyId,
      status: "active",
      deletedAt: { $exists: false },
    });

    let calculatedCount = 0;
    const errors = [];

    for (const employee of employees) {
      try {
        // Get all shifts for this employee in this period
        const shifts = await Shift.find({
          companyId,
          employeeId: employee._id,
          shiftDate: {
            $gte: periodStart,
            $lte: periodEnd,
          },
        });

        if (shifts.length === 0) {
          continue; // Skip employees with no shifts
        }

        // Calculate total hours and pay from shifts
        let totalHours = 0;
        let totalPay = 0;

        shifts.forEach((shift) => {
          totalHours += shift.hoursWorked || 0;
          totalPay += shift.totalPay || 0;
        });

        // Get tax config from automation settings (required)
        const company = await Company.findById(companyId);
        let taxConfig = null;
        
        if (company?.payrollAutomationSettings?.defaultTaxConfigId) {
          taxConfig = await TaxConfig.findOne({
            _id: company.payrollAutomationSettings.defaultTaxConfigId,
            companyId,
            isActive: true,
          });
        }
        
        // If no tax config found, skip this employee with error
        if (!taxConfig) {
          errors.push({
            employeeId: employee._id,
            employeeName: `${employee.name} ${employee.lastName}`,
            error: "תצורת מס לא נמצאה בהגדרות האוטומציה",
          });
          continue;
        }

        let taxDeduction = 0;
        let otherDeductions = [];

        if (taxConfig && taxConfig.taxBrackets && taxConfig.taxBrackets.length > 0) {
          // Calculate income tax
          const taxableIncome = Number(totalPay);
          let previousLimit = 0;

          // Sort brackets by limit
          const sortedBrackets = [...taxConfig.taxBrackets].sort((a, b) => a.limit - b.limit);

          for (const bracket of sortedBrackets) {
            if (taxableIncome > previousLimit) {
              const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
              if (taxableInBracket > 0) {
                // Rate is stored as decimal (0.10 = 10%, max is 1.0)
                // If rate > 1, it means it's stored as percentage (10 = 10%), so divide by 100
                const rate = bracket.rate > 1 ? bracket.rate / 100 : bracket.rate;
                const bracketTax = taxableInBracket * rate;
                taxDeduction += bracketTax;
              }
            }
            previousLimit = bracket.limit;
          }

          // Calculate other taxes
          if (taxConfig.otherTaxes && taxConfig.otherTaxes.length > 0) {
            taxConfig.otherTaxes.forEach((tax) => {
              // If rate > 1, it means it's stored as percentage, so divide by 100
              const rate = tax.rate > 1 ? tax.rate / 100 : tax.rate;
              const amount = tax.fixedAmount || (taxableIncome * rate);
              if (amount > 0) {
                otherDeductions.push({
                  description: tax.name,
                  amount: parseFloat(Number(amount).toFixed(2)),
                });
              }
            });
          }
        }

        // Calculate net pay
        const totalOtherDeductions = otherDeductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const calculatedNetPay = Number(totalPay) - Number(taxDeduction) - Number(totalOtherDeductions);
        const netPay = Math.max(0, calculatedNetPay);

        console.log(`[Payroll Calculation] Employee: ${employee.name} ${employee.lastName}`);
        console.log(`  Total Pay: ${totalPay}, Tax: ${taxDeduction}, Other Deductions: ${totalOtherDeductions}, Net: ${netPay}`);

        // Check if salary already exists
        let salary = await Salary.findOne({
          companyId,
          employeeId: employee._id,
          periodStart: {
            $gte: new Date(year, month - 1, 1),
            $lt: new Date(year, month, 1),
          },
        });

        if (salary) {
          // Update existing salary
          salary.totalHours = parseFloat(Number(totalHours).toFixed(2));
          salary.totalPay = parseFloat(Number(totalPay).toFixed(2));
          salary.taxDeduction = parseFloat(Number(taxDeduction).toFixed(2));
          salary.otherDeductions = otherDeductions;
          salary.netPay = parseFloat(Number(netPay).toFixed(2));
          salary.status = "Draft";
          await salary.save();
          console.log(`  Updated existing salary - Net Pay: ${salary.netPay}`);
        } else {
          // Create new salary
          salary = await Salary.create({
            companyId,
            employeeId: employee._id,
            periodStart,
            periodEnd,
            totalHours: parseFloat(Number(totalHours).toFixed(2)),
            totalPay: parseFloat(Number(totalPay).toFixed(2)),
            bonus: 0,
            taxDeduction: parseFloat(Number(taxDeduction).toFixed(2)),
            otherDeductions,
            netPay: parseFloat(Number(netPay).toFixed(2)),
            status: "Draft",
            notes: "",
          });
          console.log(`  Created new salary - Net Pay: ${salary.netPay}`);
        }

        calculatedCount++;
      } catch (error) {
        errors.push({
          employeeId: employee._id,
          employeeName: `${employee.name} ${employee.lastName}`,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `חושבו ${calculatedCount} משכורות בהצלחה`,
      data: {
        calculatedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { year, month } = req.query;

    const periodStart = new Date(Number(year), Number(month) - 1, 1);
    const periodEnd = new Date(Number(year), Number(month), 0);

    const salaries = await Salary.find({
      companyId,
      status: "Draft",
      periodStart: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    })
      .populate("employeeId", "name lastName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get pending payments
export const getPendingPayments = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { year, month } = req.query;

    const periodStart = new Date(Number(year), Number(month) - 1, 1);
    const periodEnd = new Date(Number(year), Number(month), 0);

    const salaries = await Salary.find({
      companyId,
      status: "Approved",
      periodStart: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    })
      .populate("employeeId", "name lastName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve salary
export const approveSalary = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;
    const { approved, notes } = req.body;

    const salary = await Salary.findOne({ _id: id, companyId });

    if (!salary) {
      return res.status(404).json({ success: false, message: "משכורת לא נמצאה" });
    }

    if (approved) {
      salary.status = "Approved";
      if (notes) {
        salary.notes = (salary.notes || "") + "\n" + notes;
      }
      await salary.save();

      // Create finance record with payment date from automation settings
      try {
        const company = await Company.findById(companyId);
        const automationSettings = company?.payrollAutomationSettings;
        
        // Calculate payment date based on automation settings
        let calculatedPaymentDate;
        if (automationSettings?.paymentDate) {
          const periodEndDate = new Date(salary.periodEnd);
          const paymentDay = automationSettings.paymentDate;
          calculatedPaymentDate = new Date(periodEndDate);
          calculatedPaymentDate.setMonth(calculatedPaymentDate.getMonth() + 1);
          calculatedPaymentDate.setDate(paymentDay);
        } else {
          // Fallback to current date if no automation settings
          calculatedPaymentDate = new Date();
        }

        // Determine payment terms based on the calculated payment date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const paymentDateForComparison = new Date(calculatedPaymentDate);
        paymentDateForComparison.setHours(0, 0, 0, 0);
        
        let paymentTerms;
        if (paymentDateForComparison <= today) {
          paymentTerms = "Immediate";
        } else {
          const daysDiff = Math.ceil((paymentDateForComparison - today) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 30) {
            paymentTerms = "Net 30";
          } else if (daysDiff <= 45) {
            paymentTerms = "Net 45";
          } else if (daysDiff <= 60) {
            paymentTerms = "Net 60";
          } else {
            paymentTerms = "Net 90";
          }
        }

        // Get employee details
        const employee = await Employee.findById(salary.employeeId);
        const employeeName = employee ? `${employee.name || ""} ${employee.lastName || ""}`.trim() : "עובד לא ידוע";
        const employeeId = employee?.identity || employee?._id?.toString().slice(-6) || "N/A";
        
        const periodStart = new Date(salary.periodStart).toLocaleDateString("he-IL");
        const periodEnd = new Date(salary.periodEnd).toLocaleDateString("he-IL");
        
        // Build description
        let description = `תשלום משכורת - ${employeeName} (ת.ז: ${employeeId})\n`;
        description += `תקופה: ${periodStart} - ${periodEnd}\n`;
        description += `שעות עבודה: ${salary.totalHours} שעות\n`;
        description += `שכר ברוטו: ₪${Number(salary.totalPay).toLocaleString("he-IL")}\n`;
        
        if (salary.bonus && Number(salary.bonus) > 0) {
          description += `בונוס: ₪${Number(salary.bonus).toLocaleString("he-IL")}\n`;
        }
        
        if (salary.taxDeduction && Number(salary.taxDeduction) > 0) {
          description += `ניכוי מס: ₪${Number(salary.taxDeduction).toLocaleString("he-IL")}\n`;
        }
        
        if (salary.otherDeductions && salary.otherDeductions.length > 0) {
          description += `ניכויים נוספים:\n`;
          salary.otherDeductions.forEach((deduction) => {
            description += `  - ${deduction.description}: ₪${Number(deduction.amount).toLocaleString("he-IL")}\n`;
          });
        }
        
        description += `שכר נטו: ₪${Number(salary.netPay).toLocaleString("he-IL")}`;

        // Get default bank account
        const defaultBankAccount = company?.bankAccount || "חשבון ראשי";

        // Create finance record with payment date from automation
        const financeRecord = new Finance({
          companyId,
          transactionDate: new Date(), // תאריך יצירת הרשומה
          transactionType: "Expense",
          transactionAmount: Number(salary.netPay),
          transactionCurrency: "ILS",
          transactionDescription: description,
          category: "משכורות ושכר",
          bankAccount: defaultBankAccount,
          transactionStatus: "Pending", // סטטוס Pending עד לביצוע התשלום בפועל
          recordType: "employee",
          partyId: employee ? employee._id : salary.employeeId,
          invoiceNumber: `שכר ${employeeName}`,
          paymentTerms: paymentTerms, // מועד תשלום לפי האוטומציה
          dueDate: calculatedPaymentDate, // מועד התשלום לפי תאריך התשלום שנקבע באוטומציה
          otherDetails: `משכורת תקופה ${periodStart} - ${periodEnd}. משכורת ID: ${salary._id}`,
        });

        await financeRecord.save();
        console.log(`✅ Created finance record for approved salary ${salary._id} with payment date: ${calculatedPaymentDate.toLocaleDateString("he-IL")}`);
      } catch (financeError) {
        console.error("⚠️ Error creating finance record during approval:", financeError);
        // Don't fail the approval if finance record creation fails
      }

      res.json({ success: true, message: "משכורת אושרה בהצלחה", data: salary });
    } else {
      salary.status = "Canceled";
      if (notes) {
        salary.notes = (salary.notes || "") + "\n" + notes;
      }
      await salary.save();
      res.json({ success: true, message: "משכורת נדחתה", data: salary });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject salary
export const rejectSalary = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { id } = req.params;
    const { reason } = req.body;

    const salary = await Salary.findOne({ _id: id, companyId });

    if (!salary) {
      return res.status(404).json({ success: false, message: "משכורת לא נמצאה" });
    }

    salary.status = "Canceled";
    if (reason) {
      salary.notes = (salary.notes || "") + "\nסיבת דחייה: " + reason;
    }
    await salary.save();

    res.json({ success: true, message: "משכורת נדחתה", data: salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark salaries as paid
export const markAsPaid = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { salaryIds, paymentDate, paymentMethod, bankAccount } = req.body;

    if (!salaryIds || !Array.isArray(salaryIds) || salaryIds.length === 0) {
      return res.status(400).json({ success: false, message: "יש לבחור משכורות" });
    }

    // Get company to get default bank account if not provided
    const company = await Company.findById(companyId);
    const defaultBankAccount = bankAccount || company?.bankAccount || "חשבון ראשי";

    // Fetch salaries with employee details
    const salaries = await Salary.find({
      _id: { $in: salaryIds },
      companyId,
      status: "Approved",
    }).populate("employeeId", "name lastName identity");

    if (salaries.length === 0) {
      return res.status(404).json({ success: false, message: "לא נמצאו משכורות מאושרות" });
    }

    // Calculate payment date based on automation settings
    let calculatedPaymentDate;
    if (paymentDate) {
      // If payment date is provided in request, use it
      calculatedPaymentDate = new Date(paymentDate);
    } else {
      // Otherwise, calculate based on automation settings
      const automationSettings = company?.payrollAutomationSettings;
      if (automationSettings?.paymentDate) {
        // Get the period end date from the first salary
        const firstSalary = salaries[0];
        const periodEndDate = new Date(firstSalary.periodEnd);
        
        // Calculate payment date: paymentDate day of the month following the period end
        const paymentDay = automationSettings.paymentDate;
        calculatedPaymentDate = new Date(periodEndDate);
        calculatedPaymentDate.setMonth(calculatedPaymentDate.getMonth() + 1);
        calculatedPaymentDate.setDate(paymentDay);
      } else {
        // Fallback to current date if no automation settings
        calculatedPaymentDate = new Date();
      }
    }

    // Determine payment terms based on the calculated payment date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentDateForComparison = new Date(calculatedPaymentDate);
    paymentDateForComparison.setHours(0, 0, 0, 0);
    
    let paymentTerms;
    if (paymentDateForComparison <= today) {
      paymentTerms = "Immediate";
    } else {
      // Calculate days difference
      const daysDiff = Math.ceil((paymentDateForComparison - today) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 30) {
        paymentTerms = "Net 30";
      } else if (daysDiff <= 45) {
        paymentTerms = "Net 45";
      } else if (daysDiff <= 60) {
        paymentTerms = "Net 60";
      } else {
        paymentTerms = "Net 90";
      }
    }

    const createdFinanceRecords = [];

    // Update each salary and create finance record
    for (const salary of salaries) {
      // Update salary status
      salary.status = "Paid";
      const paymentNote = `תשלום: ${calculatedPaymentDate.toLocaleDateString("he-IL")}, שיטה: ${paymentMethod || "העברה בנקאית"}`;
      salary.notes = (salary.notes || "") + (salary.notes ? "\n" : "") + paymentNote;
      await salary.save();

      // Create detailed description for finance record
      const employee = salary.employeeId;
      const employeeName = employee ? `${employee.name || ""} ${employee.lastName || ""}`.trim() : "עובד לא ידוע";
      const employeeId = employee?.identity || employee?._id?.toString().slice(-6) || "N/A";
      
      const periodStart = new Date(salary.periodStart).toLocaleDateString("he-IL");
      const periodEnd = new Date(salary.periodEnd).toLocaleDateString("he-IL");
      
      // Build detailed description
      let description = `תשלום משכורת - ${employeeName} (ת.ז: ${employeeId})\n`;
      description += `תקופה: ${periodStart} - ${periodEnd}\n`;
      description += `שעות עבודה: ${salary.totalHours} שעות\n`;
      description += `שכר ברוטו: ₪${Number(salary.totalPay).toLocaleString("he-IL")}\n`;
      
      if (salary.bonus && Number(salary.bonus) > 0) {
        description += `בונוס: ₪${Number(salary.bonus).toLocaleString("he-IL")}\n`;
      }
      
      if (salary.taxDeduction && Number(salary.taxDeduction) > 0) {
        description += `ניכוי מס: ₪${Number(salary.taxDeduction).toLocaleString("he-IL")}\n`;
      }
      
      if (salary.otherDeductions && salary.otherDeductions.length > 0) {
        description += `ניכויים נוספים:\n`;
        salary.otherDeductions.forEach((deduction) => {
          description += `  - ${deduction.description}: ₪${Number(deduction.amount).toLocaleString("he-IL")}\n`;
        });
      }
      
      description += `שכר נטו: ₪${Number(salary.netPay).toLocaleString("he-IL")}\n`;
      description += `שיטת תשלום: ${paymentMethod || "העברה בנקאית"}`;

      // Check if finance record already exists for this salary
      const existingFinanceRecord = await Finance.findOne({
        companyId,
        recordType: "employee",
        partyId: employee ? (employee._id || salary.employeeId) : salary.employeeId,
        otherDetails: { $regex: `משכורת ID: ${salary._id}` },
      });

      let savedFinanceRecord;
      if (existingFinanceRecord) {
        // Update existing finance record
        existingFinanceRecord.transactionDescription = description;
        existingFinanceRecord.transactionStatus = "Completed"; // Mark as completed when paid
        existingFinanceRecord.bankAccount = defaultBankAccount;
        if (paymentMethod) {
          // Update description to include payment method if not already there
          if (!existingFinanceRecord.transactionDescription.includes(paymentMethod)) {
            existingFinanceRecord.transactionDescription += `\nשיטת תשלום: ${paymentMethod}`;
          }
        }
        savedFinanceRecord = await existingFinanceRecord.save();
        console.log(`✅ Updated existing finance record for salary ${salary._id}`);
      } else {
        // Create new finance record with title "שכר [שם העובד]"
        // dueDate יהיה תאריך התשלום שנקבע באוטומציה
        const financeRecord = new Finance({
          companyId,
          transactionDate: new Date(), // תאריך יצירת הרשומה
          transactionType: "Expense",
          transactionAmount: Number(salary.netPay),
          transactionCurrency: "ILS",
          transactionDescription: description,
          category: "משכורות ושכר",
          bankAccount: defaultBankAccount,
          transactionStatus: "Completed", // Mark as completed when marking as paid
          recordType: "employee",
          partyId: employee ? (employee._id || salary.employeeId) : salary.employeeId,
          invoiceNumber: `שכר ${employeeName}`, // כותרת הרשומה הפיננסית
          paymentTerms: paymentTerms, // מועד תשלום לפי האוטומציה
          dueDate: calculatedPaymentDate, // מועד התשלום לפי תאריך התשלום שנקבע באוטומציה
          otherDetails: `משכורת תקופה ${periodStart} - ${periodEnd}. משכורת ID: ${salary._id}`,
        });

        savedFinanceRecord = await financeRecord.save();
        console.log(`✅ Created new finance record for salary ${salary._id}`);
      }

      createdFinanceRecords.push(savedFinanceRecord._id);
    }

    res.json({
      success: true,
      message: `${salaries.length} משכורות סומנו כשולמו ו-${createdFinanceRecords.length} רשומות פיננסיות נוצרו`,
      data: { 
        modifiedCount: salaries.length,
        financeRecordsCreated: createdFinanceRecords.length,
        financeRecordIds: createdFinanceRecords,
      },
    });
  } catch (error) {
    console.error("Error marking salaries as paid:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recalculate existing salaries
export const recalculateSalaries = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { year, month } = req.body;

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "שנה וחודש חובה",
      });
    }

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    // Get all salaries for this period
    const salaries = await Salary.find({
      companyId,
      periodStart: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    }).populate("employeeId", "countryCode");

    let recalculatedCount = 0;
    const errors = [];

    for (const salary of salaries) {
      try {
        const employee = salary.employeeId;
        if (!employee) continue;

        // Get tax config from automation settings (required)
        const company = await Company.findById(companyId);
        let taxConfig = null;
        
        if (company?.payrollAutomationSettings?.defaultTaxConfigId) {
          taxConfig = await TaxConfig.findOne({
            _id: company.payrollAutomationSettings.defaultTaxConfigId,
            companyId,
            isActive: true,
          });
        }
        
        // If no tax config found, skip this salary with error
        if (!taxConfig) {
          errors.push({
            salaryId: salary._id,
            error: "תצורת מס לא נמצאה בהגדרות האוטומציה",
          });
          continue;
        }

        let taxDeduction = 0;
        let otherDeductions = [];

        if (taxConfig && taxConfig.taxBrackets && taxConfig.taxBrackets.length > 0) {
          const taxableIncome = Number(salary.totalPay);
          let previousLimit = 0;

          const sortedBrackets = [...taxConfig.taxBrackets].sort((a, b) => a.limit - b.limit);

          for (const bracket of sortedBrackets) {
            if (taxableIncome > previousLimit) {
              const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
              if (taxableInBracket > 0) {
                const rate = bracket.rate > 1 ? bracket.rate / 100 : bracket.rate;
                taxDeduction += taxableInBracket * rate;
              }
            }
            previousLimit = bracket.limit;
          }

          if (taxConfig.otherTaxes && taxConfig.otherTaxes.length > 0) {
            taxConfig.otherTaxes.forEach((tax) => {
              const rate = tax.rate > 1 ? tax.rate / 100 : tax.rate;
              const amount = tax.fixedAmount || (taxableIncome * rate);
              if (amount > 0) {
                otherDeductions.push({
                  description: tax.name,
                  amount: parseFloat(Number(amount).toFixed(2)),
                });
              }
            });
          }
        }

        const totalOtherDeductions = otherDeductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        const calculatedNetPay = Number(salary.totalPay) - Number(taxDeduction) - Number(totalOtherDeductions);
        const netPay = Math.max(0, calculatedNetPay);

        // Update salary
        salary.taxDeduction = parseFloat(Number(taxDeduction).toFixed(2));
        salary.otherDeductions = otherDeductions;
        salary.netPay = parseFloat(Number(netPay).toFixed(2));
        await salary.save();

        recalculatedCount++;
      } catch (error) {
        errors.push({
          salaryId: salary._id,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `חושבו מחדש ${recalculatedCount} משכורות`,
      data: {
        recalculatedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payroll statistics
export const getPayrollStats = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken.companyId;

    const { year, month } = req.query;

    const periodStart = new Date(Number(year), Number(month) - 1, 1);
    const periodEnd = new Date(Number(year), Number(month), 0);

    const salaries = await Salary.find({
      companyId,
      periodStart: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    }).populate("employeeId", "name lastName");

    const stats = {
      totalSalaries: salaries.length,
      pendingApprovals: salaries.filter((s) => s.status === "Draft").length,
      approvedForPayment: salaries.filter((s) => s.status === "Approved").length,
      paid: salaries.filter((s) => s.status === "Paid").length,
      totalPayout: salaries.reduce((sum, s) => sum + Number(s.netPay || 0), 0),
      averageSalary: salaries.length > 0 ? salaries.reduce((sum, s) => sum + Number(s.netPay || 0), 0) / salaries.length : 0,
      totalHours: salaries.reduce((sum, s) => sum + Number(s.totalHours || 0), 0),
      totalEmployees: new Set(salaries.map((s) => s.employeeId?._id?.toString())).size,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

