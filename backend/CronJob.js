import cron from "node-cron";
import { checkPendingSignatures } from "./controllers/notification.controller.js";
import { addMonthlyVacationDays } from "./controllers/employees.controller.js";

// הפעלת קרון כל שעה
cron.schedule("0 * * * *", async () => {
  console.log("Running cron job to check pending signatures...");
  await checkPendingSignatures();
});

console.log("Cron job started");

cron.schedule("*/1 * * * *", async () => {
  console.log("Running monthly vacation update...");
  try {
    await addMonthlyVacationDays();
    console.log("Monthly vacation update completed");
  } catch (error) {
    console.error("Error in monthly vacation update:", error.message);
  }
});
