import cron from "node-cron";
import {
  checkPendingSignatures,
  checkPendingProcurementProposals,
  checkOverdueDeliveries,
  checkBudgetAlerts,
  checkOverdueInvoices,
  updateOverdueInvoiceStatus,
  checkLowInventory,
  checkExpiringProducts,
  checkTaskDeadlines,
  checkProjectDeadlines,
  checkCustomerOrders,
  checkUpcomingPerformanceReviews,
  checkUpcomingEvents,
  cleanupExpiredNotifications,
  sendWeeklyReports,
  sendMonthlyReports,
  checkUpcomingPaymentDueDates,
  checkOverduePayments,
  // Leads
  checkUncontactedLeads,
  checkStaleLeads,
  checkHotLeads,
  checkLeadConversionDeadline,
  // Production
  checkDelayedProductionOrders,
  checkProductionOrderDeadlines,
  checkBlockedProductionOrders,
  checkQualityIssues,
  // Shifts & Salary
  checkUnapprovedShifts,
  checkSalaryApprovalDeadline,
  checkUnpaidSalaries,
  // Warehouse
  checkWarehouseCapacityAlerts,
  checkWarehouseUtilizationLow,
  checkWarehouseLocationIssues,
  // Customers & Orders
  checkPendingCustomerOrders,
  checkCustomerOrderStatusChanges,
  checkCustomerPaymentOverdue,
  checkCustomerInactivity,
  // Suppliers
  checkSupplierPerformanceIssues,
  checkSupplierContractRenewal,
  checkSupplierPaymentIssues,
  // Invoices
  checkUnsentInvoices,
  checkInvoiceApprovalPending,
  checkInvoiceDiscrepancies,
  // Projects & Tasks
  checkBlockedTasks,
  checkProjectBudgetOverrun,
  checkProjectResourceConflicts,
  checkUnassignedTasks,
  // Employees
  checkEmployeeBirthdays,
  checkEmployeeAnniversaries,
  checkEmployeeContractExpiry,
  checkEmployeeAbsencePatterns,
  // Inventory
  checkInventoryDiscrepancies,
  checkSlowMovingInventory,
  checkInventoryTransferPending,
  checkInventoryLocationIssues,
  // Finance
  checkCashFlowAlerts,
  checkLargeTransactions,
  checkDuplicateFinanceRecords,
  checkUnreconciledTransactions,
  // Procurement
  checkProcurementApprovalDeadline,
  checkSupplierInvoiceMismatch,
  checkProcurementQualityIssues,
} from "./controllers/notification.controller.js";
import { addMonthlyVacationDays } from "./controllers/employees.controller.js";
import { sendInvoiceReminders } from "./controllers/invoiceReminder.controller.js";
import Company from "./models/companies.model.js";
import Salary from "./models/Salary.model.js";
import Employee from "./models/employees.model.js";
import Shift from "./models/Shifts.model.js";
import TaxConfig from "./models/TaxConfig.model.js";

console.log("🚀 Starting all notification cron jobs...");

// ⏰ כל שעה - דחוף
cron.schedule("0 * * * *", async () => {
  console.log("\n⏰ Running hourly notifications...");
  try {
    await checkPendingSignatures();
    await checkPendingProcurementProposals();
  } catch (error) {
    console.error("Error in hourly notifications:", error);
  }
});

// ⏰ כל 6 שעות - חשוב
cron.schedule("0 */6 * * *", async () => {
  console.log("\n⏰ Running 6-hour notifications...");
  try {
    // Existing
    await checkProjectDeadlines();
    await checkTaskDeadlines();
    await checkOverdueDeliveries();
    
    // New notifications
    await checkBlockedProductionOrders();
    await checkCustomerOrderStatusChanges();
    await checkSupplierPaymentIssues();
    await checkUnapprovedShifts();
    await checkBlockedTasks();
    await checkUnassignedTasks();
  } catch (error) {
    console.error("Error in 6-hour notifications:", error);
  }
});

// ⏰ פעמיים ביום (9:00, 17:00) - מלאי ומחסנים
cron.schedule("0 9,17 * * *", async () => {
  console.log("\n⏰ Running inventory & warehouse notifications...");
  try {
    // Existing
    await checkLowInventory();
    await checkExpiringProducts();
    
    // New notifications
    await checkWarehouseCapacityAlerts();
    await checkInventoryDiscrepancies();
    await checkInventoryTransferPending();
    await checkInventoryLocationIssues();
  } catch (error) {
    console.error("Error in inventory & warehouse notifications:", error);
  }
});

// ⏰ פעם ביום (8:00) - HR & לקוחות & כספים
cron.schedule("0 8 * * *", async () => {
  console.log("\n⏰ Running daily morning notifications (8:00 AM)...");
  try {
    // Existing
    await checkUpcomingPerformanceReviews();
    await checkCustomerOrders();
    await checkOverdueInvoices();
    await updateOverdueInvoiceStatus();
    await sendInvoiceReminders();
    await checkUpcomingPaymentDueDates();
    await checkOverduePayments();
    
    // New notifications
    await checkUncontactedLeads();
    await checkHotLeads();
    await checkLeadConversionDeadline();
    await checkDelayedProductionOrders();
    await checkProductionOrderDeadlines();
    await checkPendingCustomerOrders();
    await checkCustomerPaymentOverdue();
    await checkUnsentInvoices();
    await checkEmployeeBirthdays();
    await checkEmployeeAnniversaries();
    await checkCashFlowAlerts();
    await checkLargeTransactions();
    await checkProcurementApprovalDeadline();
  } catch (error) {
    console.error("Error in daily morning notifications:", error);
  }
});

// ⏰ פעם ביום (9:00) - תקציבים ופרויקטים
cron.schedule("0 9 * * *", async () => {
  console.log("\n⏰ Running daily budget & project notifications...");
  try {
    // Existing
    await checkBudgetAlerts();
    
    // New notifications
    await checkProjectBudgetOverrun();
    await checkProjectResourceConflicts();
    await checkInvoiceApprovalPending();
    await checkInvoiceDiscrepancies();
    await checkDuplicateFinanceRecords();
    await checkSupplierInvoiceMismatch();
    await checkProcurementQualityIssues();
  } catch (error) {
    console.error("Error in daily budget & project notifications:", error);
  }
});

// ⏰ כל 30 דקות - אירועים קרובים
cron.schedule("*/30 * * * *", async () => {
  try {
    await checkUpcomingEvents();
  } catch (error) {
    console.error("Error in event notifications:", error);
  }
});

// ⏰ שבועי - ראשון בבוקר (9:00)
cron.schedule("0 9 * * 0", async () => {
  console.log("\n⏰ Running weekly reports...");
  try {
    await sendWeeklyReports();
  } catch (error) {
    console.error("Error in weekly reports:", error);
  }
});

// ⏰ חודשי - 1 לחודש (8:00)
cron.schedule("0 8 1 * *", async () => {
  console.log("\n⏰ Running monthly tasks...");
  try {
    await sendMonthlyReports();
    await addMonthlyVacationDays();
  } catch (error) {
    console.error("Error in monthly tasks:", error);
  }
});

// ⏰ חישוב משכורות אוטומטי - 25 לחודש (9:00)
cron.schedule("0 9 25 * *", async () => {
  console.log("\n💰 Running automatic payroll calculation...");
  try {
    // Get all companies
    const companies = await Company.find({});
    
    for (const company of companies) {
      try {
        // Get previous month (calculate for last month)
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // Previous month (0-indexed)
        
        const periodStart = new Date(year, month, 1);
        const periodEnd = new Date(year, month + 1, 0);
        
        // Get all active employees for this company
        const employees = await Employee.find({
          companyId: company._id,
          status: "active",
          deletedAt: { $exists: false },
        });
        
        let calculatedCount = 0;
        
        for (const employee of employees) {
          try {
            // Get all shifts for this employee in this period
            const shifts = await Shift.find({
              companyId: company._id,
              employeeId: employee._id,
              shiftDate: {
                $gte: periodStart,
                $lte: periodEnd,
              },
            });
            
            if (shifts.length === 0) continue;
            
            // Calculate total hours and pay
            let totalHours = 0;
            let totalPay = 0;
            
            shifts.forEach((shift) => {
              totalHours += shift.hoursWorked || 0;
              totalPay += shift.totalPay || 0;
            });
            
            // Get tax config
            const countryCode = employee.countryCode || "IL";
            const taxConfig = await TaxConfig.findOne({
              countryCode,
              companyId: company._id,
              isActive: true,
            });
            
            let taxDeduction = 0;
            let otherDeductions = [];
            
            if (taxConfig && taxConfig.taxBrackets && taxConfig.taxBrackets.length > 0) {
              // Calculate income tax
              const taxableIncome = Number(totalPay);
              let previousLimit = 0;
              
              const sortedBrackets = [...taxConfig.taxBrackets].sort((a, b) => a.limit - b.limit);
              
              for (const bracket of sortedBrackets) {
                if (taxableIncome > previousLimit) {
                  const taxableInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
                  if (taxableInBracket > 0) {
                    // Rate is stored as decimal (0.10 = 10%, max is 1.0)
                    // If rate > 1, it means it's stored as percentage (10 = 10%), so divide by 100
                    const rate = bracket.rate > 1 ? bracket.rate / 100 : bracket.rate;
                    taxDeduction += taxableInBracket * rate;
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
            
            // Check if salary already exists
            let salary = await Salary.findOne({
              companyId: company._id,
              employeeId: employee._id,
              periodStart: {
                $gte: new Date(year, month, 1),
                $lt: new Date(year, month + 1, 1),
              },
            });
            
            if (salary) {
              // Update existing
              salary.totalHours = parseFloat(Number(totalHours).toFixed(2));
              salary.totalPay = parseFloat(Number(totalPay).toFixed(2));
              salary.taxDeduction = parseFloat(Number(taxDeduction).toFixed(2));
              salary.otherDeductions = otherDeductions;
              salary.netPay = parseFloat(Number(netPay).toFixed(2));
              salary.status = "Draft";
              await salary.save();
            } else {
              // Create new
              await Salary.create({
                companyId: company._id,
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
                notes: "חושב אוטומטית",
              });
            }
            
            calculatedCount++;
          } catch (error) {
            console.error(`Error calculating salary for employee ${employee._id}:`, error.message);
          }
        }
        
        console.log(`✅ Calculated ${calculatedCount} salaries for company ${company.name}`);
      } catch (error) {
        console.error(`Error calculating payroll for company ${company._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Error in automatic payroll calculation:", error);
  }
});

// ⏰ יומי - מחיקת התראות ישנות (3:00 בלילה)
cron.schedule("0 3 * * *", async () => {
  console.log("\n🧹 Cleaning up expired notifications...");
  try {
    await cleanupExpiredNotifications();
  } catch (error) {
    console.error("Error in cleanup:", error);
  }
});

// ⏰ יומי - ניקוי חברות שלא שילמו אחרי שבוע (4:00 בלילה)
cron.schedule("0 4 * * *", async () => {
  console.log("\n🧹 Cleaning up unpaid companies...");
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const unpaidCompanies = await Company.find({
      status: "Pending",
      "subscription.paymentStatus": "Pending",
      createdAt: { $lt: sevenDaysAgo },
      "subscription.subscriptionId": { $exists: false }
    });

    let deletedCount = 0;
    for (const company of unpaidCompanies) {
      try {
        console.log(`Deleting unpaid company: ${company.name} (${company._id})`);
        await Company.findByIdAndDelete(company._id);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting company ${company._id}:`, error.message);
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} unpaid companies`);
    } else {
      console.log("✅ No unpaid companies to clean up");
    }
  } catch (error) {
    console.error("❌ Error cleaning up unpaid companies:", error);
  }
});

console.log("✅ All notification cron jobs initialized successfully!");

// ⏰ פעם בשבוע (ראשון בבוקר) - בדיקות שבועיות
cron.schedule("0 7 * * 0", async () => {
  console.log("\n⏰ Running weekly notifications (Sunday 7:00 AM)...");
  try {
    await checkStaleLeads();
    await checkQualityIssues();
    await checkWarehouseUtilizationLow();
    await checkWarehouseLocationIssues();
    await checkCustomerInactivity();
    await checkSupplierPerformanceIssues();
    await checkSupplierContractRenewal();
    await checkEmployeeContractExpiry();
    await checkEmployeeAbsencePatterns();
    await checkSlowMovingInventory();
    await checkUnreconciledTransactions();
  } catch (error) {
    console.error("Error in weekly notifications:", error);
  }
});

// ⏰ פעם ביום (13:00) - משמרות ומשכורות
cron.schedule("0 13 * * *", async () => {
  console.log("\n⏰ Running shifts & salary notifications (1:00 PM)...");
  try {
    await checkSalaryApprovalDeadline();
    await checkUnpaidSalaries();
  } catch (error) {
    console.error("Error in shifts & salary notifications:", error);
  }
});

console.log("✅ All notification cron jobs initialized successfully!");
