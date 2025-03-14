import {
  Budget,
  Company,
  CustomerOrder,
  Customer,
  Department,
  Employee,
  Event,
  Finance,
  Notification,
  Inventory,
  Payment,
  PerformanceReview,
  Procurement,
  Product,
  ProductTree,
  Project,
  Signature,
  Suppliers,
  Task,
  Message,
} from "../models/index.js";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import fs from "fs/promises";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const calculateInventoryValue = (inventories, products) => {
  return inventories.reduce((total, inv) => {
    const product = products.find((p) => p._id.equals(inv.productId));
    return total + inv.quantity * (product?.unitPrice || 0);
  }, 0);
};

const findMostEfficientEmployee = (employees, tasks) => {
  const employeeTaskCount = employees.map((emp) => {
    const completedTasks = tasks.filter(
      (t) =>
        t.assignedTo.some((a) => a._id.equals(emp._id)) &&
        t.status === "completed"
    ).length;
    return { name: `${emp.name} ${emp.lastName}`, completedTasks };
  });
  return employeeTaskCount.reduce(
    (max, emp) => (emp.completedTasks > max.completedTasks ? emp : max),
    { completedTasks: 0 }
  );
};

const chatController = {
  async handleChat(req, res) {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ reply: "נדרשת הודעה" });
    }

    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let companyId;
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      companyId = decodedToken.companyId;
      if (!companyId) {
        return res.status(400).json({ reply: "לא נמצא מזהה חברה בטוקן" });
      }
    } catch (error) {
      return res.status(401).json({ reply: "טוקן לא תקין" });
    }

    try {
      const budgets = await Budget.find({ companyId }).populate(
        "companyId departmentId projectId createdBy"
      );
      const company = await Company.findById(companyId);
      const customerOrders = await CustomerOrder.find({ companyId }).populate(
        "customer companyId"
      );
      const customers = await Customer.find({ companyId }).populate(
        "companyId"
      );
      const departments = await Department.find({ companyId }).populate(
        "companyId departmentManager"
      );
      const employees = await Employee.find({ companyId }).populate(
        "companyId department"
      );
      const events = await Event.find({ companyId }).populate(
        "companyId createdBy participants"
      );
      const finances = await Finance.find({ companyId }).populate("companyId");
      const notifications = await Notification.find({ companyId }).populate(
        "companyId employeeId"
      );
      const inventories = await Inventory.find({ companyId }).populate(
        "companyId productId"
      );
      const payments = await Payment.find({ companyId }).populate("companyId");
      const performanceReviews = await PerformanceReview.find({
        companyId,
      }).populate("companyId employeeId createdBy");
      const procurements = await Procurement.find({ companyId }).populate(
        "companyId supplierId"
      );
      const products = await Product.find({ companyId }).populate(
        "companyId supplierId"
      );
      const productTrees = await ProductTree.find({ companyId }).populate(
        "companyId productId"
      );
      const projects = await Project.find({ companyId }).populate(
        "companyId projectManager departmentId teamMembers.employeeId"
      );
      const signatures = await Signature.find({ companyId }).populate(
        "companyId"
      );
      const suppliers = await Suppliers.find({ companyId }).populate(
        "companyId"
      );
      const tasks = await Task.find({ companyId }).populate(
        "companyId projectId departmentId assignedTo"
      );

      const inventoryValue = calculateInventoryValue(inventories, products);
      const mostEfficientEmployee = findMostEfficientEmployee(employees, tasks);
      const employeesOnLeave = employees.filter((e) =>
        e.attendance.some(
          (a) =>
            a.status === "On Leave" &&
            new Date(a.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
      ).length;
      const leavePercentage =
        employees.length > 0
          ? ((employeesOnLeave / employees.length) * 100).toFixed(2)
          : 0;

      let context = `מידע מלא עבור החברה "${
        company?.name || "לא ידוע"
      }" (companyId: ${companyId}):\n\n`;
      context += `תקציבים (${budgets.length}):\n${budgets
        .map((b) => `- ${b.departmentOrProjectName}: ${b.amount} ${b.currency}`)
        .join("\n")}\n\n`;
      context += `לקוחות (${customers.length}):\n${customers
        .map((c) => `- ${c.name}, אימייל: ${c.email}`)
        .join("\n")}\n\n`;
      context += `הזמנות לקוחות (${customerOrders.length}):\n${customerOrders
        .map(
          (o) =>
            `- לקוח: ${o.customer?.name || "לא ידוע"}, סכום: ${o.orderTotal}`
        )
        .join("\n")}\n\n`;
      context += `מחלקות (${departments.length}):\n${departments
        .map((d) => `- ${d.name}`)
        .join("\n")}\n\n`;
      context += `עובדים (${employees.length}):\n${employees
        .map((e) => `- ${e.name} ${e.lastName}, תפקיד: ${e.role || "לא מוגדר"}`)
        .join("\n")}\n\n`;
      context += `אירועים (${events.length}):\n${events
        .map((e) => `- ${e.title}, תאריך: ${e.startDate}`)
        .join("\n")}\n\n`;
      context += `פיננסים (${finances.length}):\n${finances
        .map(
          (f) =>
            `- ${f.transactionType}: ${f.transactionAmount} ${f.transactionCurrency}`
        )
        .join("\n")}\n\n`;
      context += `מלאי (${
        inventories.length
      }, שווי כולל: ${inventoryValue}):\n${inventories
        .map(
          (i) =>
            `- ${i.productId?.productName || "לא ידוע"}, כמות: ${i.quantity}`
        )
        .join("\n")}\n\n`;
      context += `תשלומים (${payments.length}):\n${payments
        .map((p) => `- ${p.amount} ${p.currency}`)
        .join("\n")}\n\n`;
      context += `ביקורות ביצועים (${
        performanceReviews.length
      }):\n${performanceReviews
        .map((r) => `- ${r.title}, עובד: ${r.employeeId?.name || "לא ידוע"}`)
        .join("\n")}\n\n`;
      context += `רכש (${procurements.length}):\n${procurements
        .map((p) => `- ספק: ${p.supplierName}, סכום: ${p.totalCost}`)
        .join("\n")}\n\n`;
      context += `מוצרים (${products.length}):\n${products
        .map((p) => `- ${p.productName}, מחיר: ${p.unitPrice}`)
        .join("\n")}\n\n`;
      context += `עצי מוצר (${productTrees.length}):\n${productTrees
        .map((pt) => `- ${pt.productId?.productName || "לא ידוע"}`)
        .join("\n")}\n\n`;
      context += `פרויקטים (${projects.length}):\n${projects
        .map((p) => `- ${p.name}, סטטוס: ${p.status}`)
        .join("\n")}\n\n`;
      context += `חתימות (${signatures.length}):\n${signatures
        .map((s) => `- ${s.name}, נדרש: ${s.requiredSignatures}`)
        .join("\n")}\n\n`;
      context += `ספקים (${suppliers.length}):\n${suppliers
        .map(
          (s) =>
            `- ${s.SupplierName}, טלפון: ${s.Contact || "לא זמין"}, דירוג: ${
              s.Rating ? s.Rating.join(", ") : "לא מדורג"
            }`
        )
        .join("\n")}\n\n`;
      context += `משימות (${tasks.length}):\n${tasks
        .map((t) => `- ${t.title}, סטטוס: ${t.status}`)
        .join("\n")}\n\n`;
      context += `סטטיסטיקות נוספות:\n- עובד יעיל: ${mostEfficientEmployee.name} (${mostEfficientEmployee.completedTasks} משימות)\n- אחוז בחופשה: ${leavePercentage}%\n`;

      // API חיצוני
      if (message.toLowerCase().includes("מזג האוויר")) {
        const supplierNameMatch = message.match(/של הספק\s+(.+)/i);
        if (supplierNameMatch) {
          const supplier = suppliers.find(
            (s) =>
              s.SupplierName.toLowerCase() ===
              supplierNameMatch[1].toLowerCase()
          );
          if (supplier && supplier.Address) {
            const response = await axios.get(
              `http://api.openweathermap.org/data/2.5/weather?q=${supplier.Address}&appid=${process.env.WEATHER_API_KEY}&units=metric`
            );
            context += `\nמזג אוויר ב-${supplier.Address}: ${response.data.weather[0].description}, טמפרטורה: ${response.data.main.temp}°C`;
          }
        }
      }
      if (message.toLowerCase().includes("מחיר הדולר")) {
        const response = await axios.get(
          `https://openexchangerates.org/api/latest.json?app_id=${process.env.EXCHANGE_RATE_API_KEY}`
        );
        const usdRate = response.data.rates.ILS;
        context += `\nשער הדולר הנוכחי: 1 USD = ${usdRate} ILS`;
      }

      // ניתוח PDF רק כשצריך
      let fileContents = "";
      if (message.toLowerCase().includes("מה כתוב בקובץ")) {
        const { default: pdfParse } = await import("pdf-parse"); // טעינה דינמית
        const supplierNameMatch = message.match(/של הספק\s+(.+)/i);
        if (supplierNameMatch) {
          const supplier = suppliers.find(
            (s) =>
              s.SupplierName.toLowerCase() ===
              supplierNameMatch[1].toLowerCase()
          );
          if (supplier && supplier.attachments.length > 0) {
            const fileUrl = supplier.attachments[0].fileUrl;
            const fileBuffer = await fs.readFile(fileUrl); // הנחה שהקובץ נגיש מקומית
            const pdfData = await pdfParse(fileBuffer);
            fileContents = pdfData.text;
            context += `\nתוכן הקובץ של הספק ${
              supplier.SupplierName
            }: ${fileContents.substring(0, 500)}...`;
          }
        }
      }

      const lowerMessage = message.toLowerCase();
      let reply = "";

      // בדיקה מפורשת לשאלות על דירוג ספקים
      if (lowerMessage.includes("דירוג") && lowerMessage.includes("ספק")) {
        let supplierName = "";
        if (lowerMessage.includes("של הספק")) {
          const supplierNameMatch = lowerMessage.match(/של הספק\s+(.+)/i);
          if (supplierNameMatch) {
            supplierName = supplierNameMatch[1].trim();
          }
        }

        const supplier = suppliers.find(
          (s) =>
            s.SupplierName.toLowerCase() === supplierName.toLowerCase() ||
            (supplierName === "" && suppliers.length === 1)
        );

        if (supplier) {
          if (supplier.Rating && supplier.Rating.length > 0) {
            reply = `הדירוג של הספק ${
              supplier.SupplierName
            } הוא: ${supplier.Rating.join(", ")}`;
          } else {
            reply = `לספק ${supplier.SupplierName} אין דירוג פנימי שמור במערכת.`;
          }
        } else {
          reply = supplierName
            ? `לא נמצא ספק בשם "${supplierName}" במערכת.`
            : "לא נמצא ספק במערכת.";
        }

        if (reply) {
          // אם נמצאה תשובה, נחזיר אותה מיד
          const newMessage = new Message({ userId, message, reply });
          await newMessage.save();
          return res.json({ reply });
        }
      }
      if (lowerMessage.includes("כמה עובדים יש בחברה שלי")) {
        reply = `בחברה שלך, "${company?.name || "לא ידוע"}", יש ${
          employees.length
        } עובדים.`;
      } else if (lowerMessage.includes("טלפון של הספק")) {
        const supplierNameMatch = lowerMessage.match(/של הספק\s+(.+)/i);
        if (supplierNameMatch) {
          const supplierName = supplierNameMatch[1].trim();
          const supplier = suppliers.find(
            (s) => s.SupplierName.toLowerCase() === supplierName.toLowerCase()
          );
          if (supplier) {
            reply = `מספר הטלפון של הספק ${supplier.SupplierName} הוא: ${
              supplier.Contact || "לא זמין"
            }`;
          } else {
            reply = `לא נמצא ספק בשם "${supplierName}" בבסיס הנתונים של החברה שלך.`;
          }
        }
      } else if (lowerMessage.includes("תן לי הכל")) {
        reply = context;
      } else if (lowerMessage.includes("סטטיסטיקות")) {
        const totalBudget = budgets.reduce(
          (sum, b) => sum + (b.amount || 0),
          0
        );
        const totalPayments = payments.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );
        reply = `סטטיסטיקות עבור "${company?.name || "לא ידוע"}":\n- עובדים: ${
          employees.length
        }\n- תקציבים: ${totalBudget}\n- תשלומים: ${totalPayments}\n- שווי מלאי: ${inventoryValue}`;
      } else if (lowerMessage.includes("מי זה")) {
        reply =
          "אנא תבהיר למי אתה מתכוון (למשל, 'מי זה הספק X?' או 'מי זה העובד Y?').";
      } else {
        const prompt = `
                אתה צ'אט בוט חכם שמספק תשובות מדויקות ומפורטות על סמך כל הנתונים בבסיס הנתונים של החברה.
                הנה המידע המלא הזמין:
                ${context}
   
                הנחיות חשובות:
   
                1.  אם המשתמש שואל שאלה כללית כמו "מה הדירוג של הספק שלי?", נסה לזהות את הספק שאליו הוא מתכוון.
                    אם יש רק ספק אחד בחברה, הנח שהוא מתכוון אליו. אם יש כמה ספקים, בקש ממנו לציין את שם הספק.
                2.  אם שאלה מתייחסת ל-"דירוג", חפש את השדה "Rating" במסדי הנתונים המתאימים (ספקים, עובדים, וכו').
   
                שאלת המשתמש: ${message}
                תענה על השאלה בצורה ברורה ומדויקת. אם השאלה לא ברורה או חסר מידע, תציין זאת ותבקש הבהרה.
              `;
        const result = await model.generateContent(prompt);
        reply = result.response.text();
      }

      const newMessage = new Message({ userId, message, reply });
      await newMessage.save();

      res.json({ reply });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ reply: "שגיאה בעיבוד הבקשה" });
    }
  },
};

export default chatController;
