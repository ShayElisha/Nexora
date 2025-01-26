import cron from "node-cron";
import { checkPendingSignatures } from "./controllers/notification.controller.js";

// הפעלת קרון כל שעה
cron.schedule("0 * * * *", async () => {
  console.log("Running cron job to check pending signatures...");
  await checkPendingSignatures();
});

console.log("Cron job started");
