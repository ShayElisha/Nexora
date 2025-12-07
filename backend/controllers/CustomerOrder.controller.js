import CustomerOrder from "../models/CustomerOrder.model.js";
import Product from "../models/product.model.js"; // Used to fetch unitPrice for products
import PriceList from "../models/PriceList.model.js";
import Invoice from "../models/invoice.model.js";
import Company from "../models/companies.model.js";
import Customer from "../models/customers.model.js";
import Employee from "../models/employees.model.js";
import Finance from "../models/finance.model.js";
import Notification from "../models/notification.model.js";
import Project from "../models/project.model.js";
import Lead from "../models/Lead.model.js";
import Department from "../models/department.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import puppeteer from "puppeteer";
import { transporter } from "../config/lib/nodemailer.js";
import { createOrderSummaryEmail } from "../emails/emailHandlers.js";
import { uploadToCloudinaryFile } from "../config/lib/cloudinary.js";
import {
  linkOrderToLead,
  linkOrderToProject,
} from "../services/RelationshipService.js";
import { createProductionOrderFromCustomerOrder } from "./ProductionOrder.controller.js";

const normalizeOrderShippingAddress = (address = {}) => {
  if (!address || typeof address !== "object") {
    return null;
  }

  const normalized = {
    street: (address.street || "").trim(),
    city: (address.city || "").trim(),
    state: (address.state || "").trim(),
    country: (address.country || "").trim(),
    zipCode: (address.zipCode || "").trim(),
    contactName: (address.contactName || "").trim(),
    contactPhone: (address.contactPhone || "").trim(),
  };

  const hasValue = Object.values(normalized).some((value) =>
    typeof value === "string" ? value.length > 0 : Boolean(value)
  );

  return hasValue ? normalized : null;
};

/**
 * Generate HTML template for invoice (helper function)
 */
const generateInvoiceHTMLForPDF = async (invoice) => {
  const company = invoice.companyId;
  const customer = invoice.customerId;
  const logo = company?.logo || "";
  
  // Use the same HTML template as in invoice.controller.js
  // For simplicity, we'll generate a basic version here
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #ddd; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #333; }
    .company-info { flex: 1; }
    .company-logo { max-width: 150px; max-height: 80px; margin-bottom: 10px; }
    .invoice-info { text-align: right; }
    .invoice-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .invoice-number { font-size: 18px; color: #666; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .totals-section { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 12px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        ${logo ? `<img src="${logo}" alt="Company Logo" class="company-logo" />` : ""}
        <h2>${company?.name || "Company Name"}</h2>
        ${company?.email ? `<p>Email: ${company.email}</p>` : ""}
        ${company?.phone ? `<p>Phone: ${company.phone}</p>` : ""}
      </div>
      <div class="invoice-info">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
        <div style="margin-top: 20px;">
          <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
    <div style="margin-bottom: 40px;">
      <div class="section-title">Bill To:</div>
      ${customer ? `
        <p><strong>${customer.name || "Customer"}</strong></p>
        ${customer.email ? `<p>${customer.email}</p>` : ""}
        ${customer.phone ? `<p>${customer.phone}</p>` : ""}
      ` : "<p>No customer specified</p>"}
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items?.map(item => `
          <tr>
            <td>${item.description || ""}</td>
            <td class="text-right">${item.quantity || 0}</td>
            <td class="text-right">${invoice.currency || "USD"} ${item.unitPrice?.toFixed(2) || "0.00"}</td>
            <td class="text-right">${invoice.currency || "USD"} ${item.total?.toFixed(2) || "0.00"}</td>
          </tr>
        `).join("") || ""}
      </tbody>
    </table>
    <div class="totals-section">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>${invoice.currency || "USD"} ${invoice.subtotal?.toFixed(2) || "0.00"}</span>
      </div>
      ${invoice.taxAmount > 0 ? `
      <div class="totals-row">
        <span>Tax (${invoice.taxRate}%):</span>
        <span>${invoice.currency || "USD"} ${invoice.taxAmount?.toFixed(2) || "0.00"}</span>
      </div>
      ` : ""}
      <div class="totals-row total">
        <span>Total:</span>
        <span>${invoice.currency || "USD"} ${invoice.totalAmount?.toFixed(2) || "0.00"}</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send invoice email automatically (for orders)
 */
const sendInvoiceEmailFromOrder = async (invoice) => {
  try {
    const customer = invoice.customerId;
    const company = invoice.companyId;

    // Determine recipient email
    let recipientEmail = null;
    let recipientName = null;

    if (customer && customer.email) {
      // Customer invoice - send to customer
      recipientEmail = customer.email;
      recipientName = customer.name;
    } else if (company && company.email) {
      // Fallback to company email
      recipientEmail = company.email;
      recipientName = company.name;
    }

    if (!recipientEmail) {
      console.warn(`⚠️ No email found for invoice ${invoice.invoiceNumber}, skipping email send`);
      return;
    }

    console.log(`📧 Sending invoice email to ${recipientEmail} for invoice ${invoice.invoiceNumber}`);

    // Generate PDF buffer using the invoice HTML
    let pdfBuffer = null;
    try {
      // Import generateInvoiceHTML from invoice controller (we'll create it inline here)
      const html = await generateInvoiceHTMLForPDF(invoice);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      
      await browser.close();
      console.log(`✅ PDF buffer generated successfully (${pdfBuffer.length} bytes)`);
    } catch (pdfError) {
      console.error("❌ Error generating PDF buffer, sending email without attachment:", pdfError.message);
    }

    // Generate PDF URL (still include in email as backup)
    const baseUrl = process.env.NEXORA_API_URL || process.env.API_URL || "http://localhost:5000";
    const pdfUrl = `${baseUrl}/api/invoices/${invoice._id}/pdf`;

    // Get logo URL
    const logoUrl = company?.logo 
      ? (company.logo.startsWith('http') ? company.logo : `${process.env.FRONTEND_URL || "http://localhost:5173"}${company.logo}`)
      : `${process.env.FRONTEND_URL || "http://localhost:5173"}/assets/logo.png`;

    // Create email HTML
    const emailHTML = createPaymentInvoiceEmail(recipientName || company?.name || "Customer", invoice, pdfUrl, logoUrl);

    // Prepare email data with PDF attachment if available
    const emailData = {
      from: process.env.EMAIL_USER || `Nexora <${process.env.EMAIL_FROM || 'noreply@nexora.com'}>`,
      to: recipientEmail,
      subject: `Nexora - Invoice ${invoice.invoiceNumber}`,
      html: emailHTML,
    };

    // Add PDF attachment if buffer is available
    if (pdfBuffer) {
      emailData.attachments = [
        {
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
      console.log(`📎 PDF attachment added to email`);
    }

    const info = await transporter.sendMail(emailData);
    console.log(`✅ Invoice email sent successfully to ${recipientEmail}`);
    console.log(`📧 Email message ID: ${info.messageId}`);

  } catch (error) {
    console.error("❌ Error sending invoice email:", error);
    console.error("❌ Error message:", error.message);
    // Don't throw - email failure shouldn't break invoice creation
  }
};

/**
 * Helper function to create invoice from order
 */
export const createInvoiceFromOrder = async (order, companyId, decodedToken) => {
  try {
    console.log(`📝 Creating invoice for order: ${order._id}, company: ${companyId}`);
    
    if (!order._id) {
      throw new Error("Order must be saved before creating invoice");
    }
    
    // Get employeeId
    let employeeId = decodedToken.employeeId || decodedToken.userId || decodedToken.id;
    console.log(`👤 Employee ID from token: ${employeeId}`);
    if (!employeeId && decodedToken.userId) {
      try {
        const employee = await Employee.findById(decodedToken.userId);
        if (employee) {
          employeeId = employee._id;
          console.log(`👤 Employee ID from DB: ${employeeId}`);
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
      }
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    
    const lastInvoice = await Invoice.findOne({
      companyId,
      invoiceNumber: new RegExp(`^${prefix}`),
    })
      .sort({ invoiceNumber: -1 })
      .select("invoiceNumber");

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(
        lastInvoice.invoiceNumber.replace(prefix, "")
      );
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    const invoiceNumber = `${prefix}${sequence.toString().padStart(4, "0")}`;

    // Convert order items to invoice items
    const invoiceItems = [];
    console.log(`📦 Converting ${order.items.length} order items to invoice items`);
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        console.warn(`⚠️ Product not found: ${item.product}`);
      }
      invoiceItems.push({
        description: product?.productName || product?.name || "Product",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: 0,
        total: item.totalPrice,
      });
    }
    console.log(`📦 Created ${invoiceItems.length} invoice items`);

    // Create invoice
    console.log(`📄 Creating invoice with number: ${invoiceNumber}`);
    const invoice = new Invoice({
      companyId: companyId,
      invoiceNumber,
      customerId: order.customer,
      orderId: order._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: invoiceItems,
      globalDiscount: {
        type: "percentage",
        value: order.globalDiscount || 0,
      },
      taxRate: order.taxRate || 0,
      notes: order.notes || `Invoice for Order #${order._id}`,
      paymentTerms: order.paymentTerms || "Net 30",
      createdBy: employeeId || null,
      status: "Draft",
    });

    console.log(`💾 Saving invoice to database...`);
    console.log(`📋 Invoice data before save:`, {
      invoiceNumber,
      companyId: companyId?.toString(),
      customerId: order.customer?.toString(),
      orderId: order._id?.toString(),
      itemsCount: invoiceItems.length
    });
    
    try {
      await invoice.save();
      console.log(`✅ Invoice ${invoiceNumber} (${invoice._id}) created successfully from order ${order._id}`);
    } catch (saveError) {
      console.error("❌ Error saving invoice to database:");
      console.error("❌ Save error name:", saveError.name);
      console.error("❌ Save error code:", saveError.code);
      console.error("❌ Save error message:", saveError.message);
      console.error("❌ Save error keyValue:", saveError.keyValue);
      
      // Handle duplicate invoice number
      if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
        console.log(`⚠️ Duplicate invoice number detected. Generating new invoice number...`);
        // Try again with a new invoice number
        const newSequence = sequence + 1;
        const newInvoiceNumber = `${prefix}${newSequence.toString().padStart(4, "0")}`;
        invoice.invoiceNumber = newInvoiceNumber;
        console.log(`🔄 Retrying with new invoice number: ${newInvoiceNumber}`);
        await invoice.save();
        console.log(`✅ Invoice ${newInvoiceNumber} (${invoice._id}) created successfully after retry`);
      } else {
        throw saveError;
      }
    }
    
    // Reload invoice to ensure calculated fields (totalAmount, etc.) are available
    const savedInvoice = await Invoice.findById(invoice._id)
      .populate("customerId", "name email phone address")
      .populate("companyId", "name email phone address logo");
    
    if (!savedInvoice) {
      throw new Error(`Invoice was saved but could not be retrieved. Invoice ID: ${invoice._id}`);
    }
    console.log(`💰 Invoice total amount: ${savedInvoice.totalAmount}`);
    console.log(`📊 Invoice subtotal: ${savedInvoice.subtotal}, Tax: ${savedInvoice.taxAmount}, Discount: ${savedInvoice.discountAmount}`);
    
    // Send invoice email automatically (non-blocking)
    try {
      await sendInvoiceEmailFromOrder(savedInvoice);
    } catch (emailError) {
      console.error("❌ Error sending invoice email (invoice still created):", emailError.message);
      // Don't throw - email failure shouldn't break invoice creation
    }
    
    return savedInvoice || invoice;
  } catch (error) {
    console.error("❌ Error creating invoice from order:");
    console.error("❌ Error name:", error.name);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error keyValue:", error.keyValue);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};

/**
 * Helper function to create financial record from order (without invoice - invoice will be added later)
 */
export const createFinancialRecordFromOrderWithoutInvoice = async (order, companyId) => {
  try {
    console.log(`💰 Creating financial record for order: ${order._id} (without invoice yet)`);
    
    if (!order) {
      throw new Error("Order is required to create financial record");
    }
    
    if (!order._id) {
      throw new Error("Order must be saved before creating financial record");
    }
    
    if (!order.orderTotal) {
      throw new Error("Order total is required");
    }
    
    // Create financial record for the order (invoice will be added later)
    const financialRecord = new Finance({
      companyId: companyId,
      transactionDate: order.orderDate || new Date(),
      transactionType: "Income", // Order from customer is income
      transactionAmount: order.orderTotal || 0,
      transactionCurrency: "USD", // Default currency, will be updated when invoice is created
      transactionDescription: `Order #${order._id}`,
      category: "Sales", // Default category for customer orders
      bankAccount: "Default", // Default bank account - can be configured later
      transactionStatus: "Pending", // Will be updated when payment is received
      recordType: "customer",
      partyId: order.customer,
      orderId: order._id,
      paymentTerms: order.paymentTerms || "Net 30",
      otherDetails: JSON.stringify({
        orderTotal: order.orderTotal,
        taxAmount: order.taxAmount || 0,
        taxRate: order.taxRate || 0,
        globalDiscount: order.globalDiscount || 0,
        subtotal: order.orderTotal - (order.taxAmount || 0),
      }),
    });

    console.log(`💾 Saving financial record to database...`);
    await financialRecord.save();
    console.log(`✅ Financial record ${financialRecord._id} created automatically for order ${order._id}`);
    
    return financialRecord;
  } catch (error) {
    console.error("❌ Error creating financial record from order:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};

/**
 * Helper function to create financial record from order and invoice (kept for backward compatibility)
 */
export const createFinancialRecordFromOrder = async (order, invoice, companyId) => {
  try {
    console.log(`💰 Creating financial record for order: ${order._id}, invoice: ${invoice.invoiceNumber}`);
    
    if (!order || !invoice) {
      throw new Error("Order and invoice are required to create financial record");
    }
    
    if (!order.orderTotal && !invoice.totalAmount) {
      throw new Error("Order total or invoice total amount is required");
    }
    
    // Create financial record for the order/invoice
    const financialRecord = new Finance({
      companyId: companyId,
      transactionDate: order.orderDate || new Date(),
      transactionType: "Income", // Order from customer is income
      transactionAmount: order.orderTotal || invoice.totalAmount || 0,
      transactionCurrency: invoice.currency || "USD",
      transactionDescription: `Order #${order._id} - Invoice ${invoice.invoiceNumber}`,
      category: "Sales", // Default category for customer orders
      bankAccount: "Default", // Default bank account - can be configured later
      transactionStatus: "Pending", // Will be updated when payment is received
      recordType: "customer",
      partyId: order.customer,
      invoiceNumber: invoice.invoiceNumber,
      paymentTerms: order.paymentTerms || invoice.paymentTerms || "Net 30",
      invoiceId: invoice._id,
      orderId: order._id,
      otherDetails: JSON.stringify({
        orderTotal: order.orderTotal,
        taxAmount: order.taxAmount || 0,
        taxRate: order.taxRate || 0,
        globalDiscount: order.globalDiscount || 0,
        subtotal: order.orderTotal - (order.taxAmount || 0),
      }),
    });

    console.log(`💾 Saving financial record to database...`);
    await financialRecord.save();
    console.log(`✅ Financial record ${financialRecord._id} created automatically for order ${order._id} and invoice ${invoice.invoiceNumber}`);
    
    return financialRecord;
  } catch (error) {
    console.error("❌ Error creating financial record from order:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw error;
  }
};

/**
 * Generate HTML template for order summary PDF
 */
const generateOrderHTMLForPDF = async (order) => {
  const company = order.companyId;
  const customer = order.customer;
  const logo = company?.logo || "";
  
  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Summary - ${order._id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; direction: rtl; }
    .order-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #ddd; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #333; }
    .company-info { flex: 1; }
    .company-logo { max-width: 150px; max-height: 80px; margin-bottom: 10px; }
    .order-info { text-align: left; }
    .order-title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
    .order-number { font-size: 18px; color: #666; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .items-table th { background: #f5f5f5; padding: 12px; text-align: right; border-bottom: 2px solid #ddd; }
    .items-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: right; }
    .text-left { text-align: left; }
    .totals-section { margin-right: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 12px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="order-container">
    <div class="header">
      <div class="company-info">
        ${logo ? `<img src="${logo}" alt="Company Logo" class="company-logo" />` : ""}
        <h2>${company?.name || "Company Name"}</h2>
        ${company?.email ? `<p>Email: ${company.email}</p>` : ""}
        ${company?.phone ? `<p>Phone: ${company.phone}</p>` : ""}
      </div>
      <div class="order-info">
        <div class="order-title">סיכום הזמנה</div>
        <div class="order-number">מספר הזמנה: ${order._id}</div>
        <div style="margin-top: 20px;">
          <p><strong>תאריך הזמנה:</strong> ${new Date(order.orderDate).toLocaleDateString('he-IL')}</p>
          ${order.deliveryDate ? `<p><strong>תאריך משלוח:</strong> ${new Date(order.deliveryDate).toLocaleDateString('he-IL')}</p>` : ''}
          <p><strong>סטטוס:</strong> ${order.status || 'Pending'}</p>
        </div>
      </div>
    </div>
    <div style="margin-bottom: 40px;">
      <div style="font-weight: bold; margin-bottom: 10px;">ללקוח:</div>
      ${customer ? `
        <p><strong>${customer.name || "Customer"}</strong></p>
        ${customer.email ? `<p>${customer.email}</p>` : ""}
        ${customer.phone ? `<p>${customer.phone}</p>` : ""}
      ` : "<p>No customer specified</p>"}
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th>תיאור</th>
          <th class="text-left">כמות</th>
          <th class="text-left">מחיר ליחידה</th>
          <th class="text-left">סה"כ</th>
        </tr>
      </thead>
      <tbody>
        ${order.items?.map(item => `
          <tr>
            <td>${item.product?.productName || item.product?.name || "Product"}</td>
            <td class="text-left">${item.quantity || 0}</td>
            <td class="text-left">USD ${item.unitPrice?.toFixed(2) || "0.00"}</td>
            <td class="text-left">USD ${item.totalPrice?.toFixed(2) || "0.00"}</td>
          </tr>
        `).join("") || ""}
      </tbody>
    </table>
    <div class="totals-section">
      ${order.globalDiscount > 0 ? `
      <div class="totals-row">
        <span>הנחה (${order.globalDiscount}%):</span>
        <span>-USD ${((order.orderTotal * order.globalDiscount) / 100).toFixed(2)}</span>
      </div>
      ` : ''}
      ${order.taxAmount > 0 ? `
      <div class="totals-row">
        <span>מע"מ (${order.taxRate}%):</span>
        <span>USD ${order.taxAmount?.toFixed(2) || "0.00"}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>סה"כ:</span>
        <span>USD ${order.orderTotal?.toFixed(2) || "0.00"}</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Send order summary email with PDF attachment and save PDF URL to financial record
 */
const sendOrderSummaryEmail = async (order, financialRecord) => {
  try {
    const company = order.companyId;
    const customer = order.customer;

    // Determine recipient email
    let recipientEmail = null;
    let recipientName = null;

    if (customer && customer.email) {
      // Customer order - send to customer
      recipientEmail = customer.email;
      recipientName = customer.name;
    } else if (company && company.email) {
      // Fallback to company email
      recipientEmail = company.email;
      recipientName = company.name;
    }

    if (!recipientEmail) {
      console.warn(`⚠️ No email found for order ${order._id}, skipping email send`);
      return;
    }

    console.log(`📧 Sending order summary email to ${recipientEmail} for order ${order._id}`);

    // Generate PDF buffer
    let pdfBuffer = null;
    let pdfUrl = null;
    try {
      const html = await generateOrderHTMLForPDF(order);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      
      await browser.close();
      console.log(`✅ Order PDF buffer generated successfully (${pdfBuffer.length} bytes)`);

      // Upload PDF to Cloudinary
      try {
        const pdfBase64 = pdfBuffer.toString('base64');
        const uploadResult = await uploadToCloudinaryFile(pdfBase64);
        pdfUrl = uploadResult.secure_url;
        console.log(`✅ Order PDF uploaded to Cloudinary: ${pdfUrl}`);
      } catch (uploadError) {
        console.error("❌ Error uploading PDF to Cloudinary:", uploadError.message);
        // Fallback to API URL if upload fails
        const baseUrl = process.env.NEXORA_API_URL || process.env.API_URL || "http://localhost:5000";
        pdfUrl = `${baseUrl}/api/orders/${order._id}/pdf`;
      }
    } catch (pdfError) {
      console.error("❌ Error generating order PDF buffer, sending email without attachment:", pdfError.message);
    }

    // Get logo URL
    const logoUrl = company?.logo 
      ? (company.logo.startsWith('http') ? company.logo : `${process.env.FRONTEND_URL || "http://localhost:5173"}${company.logo}`)
      : `${process.env.FRONTEND_URL || "http://localhost:5173"}/assets/logo.png`;

    // Create email HTML
    const emailHTML = createOrderSummaryEmail(recipientName || company?.name || "Customer", order, pdfUrl || "#", logoUrl);

    // Prepare email data with PDF attachment if available
    const emailData = {
      from: process.env.EMAIL_USER || `Nexora <${process.env.EMAIL_FROM || 'noreply@nexora.com'}>`,
      to: recipientEmail,
      subject: `Nexora - Order Summary #${order._id}`,
      html: emailHTML,
    };

    // Add PDF attachment if buffer is available
    if (pdfBuffer) {
      emailData.attachments = [
        {
          filename: `Order_Summary_${order._id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ];
      console.log(`📎 Order PDF attachment added to email`);
    }

    // Send email
    const info = await transporter.sendMail(emailData);
    console.log(`✅ Order summary email sent successfully to ${recipientEmail}`);
    console.log(`📧 Email message ID: ${info.messageId}`);

    // Save PDF URL to financial record if available
    // Only save if pdfUrl is a valid Cloudinary URL (starts with http/https and contains cloudinary)
    if (pdfUrl && pdfBuffer) {
      try {
        // If pdfUrl is not a Cloudinary URL, try to upload the PDF buffer
        if (!pdfUrl.includes('cloudinary') && !pdfUrl.includes('res.cloudinary.com')) {
          try {
            console.log(`📤 Uploading order PDF to Cloudinary (retry)...`);
            const pdfBase64 = pdfBuffer.toString('base64');
            const uploadResult = await uploadToCloudinaryFile(pdfBase64);
            pdfUrl = uploadResult.secure_url;
            console.log(`✅ Order PDF uploaded to Cloudinary: ${pdfUrl}`);
          } catch (retryUploadError) {
            console.error("❌ Error uploading PDF to Cloudinary (retry):", retryUploadError.message);
            // Skip saving if upload failed - don't save invalid URL
            return;
          }
        }
        
        // If financial record was passed, use it; otherwise try to find it by orderId
        let recordToUpdate = financialRecord;
        
        if (!recordToUpdate && order._id) {
          recordToUpdate = await Finance.findOne({ orderId: order._id });
        }
        
        // Also try to find by invoiceId if available
        if (!recordToUpdate && order.invoiceId) {
          recordToUpdate = await Finance.findOne({ invoiceId: order.invoiceId });
        }
        
        if (recordToUpdate) {
          recordToUpdate.attachmentURL = Array.isArray(recordToUpdate.attachmentURL) 
            ? recordToUpdate.attachmentURL 
            : [];
          
          // Only add if URL is valid and not already in the array
          if (pdfUrl && pdfUrl.startsWith('http') && !recordToUpdate.attachmentURL.includes(pdfUrl)) {
            recordToUpdate.attachmentURL.push(pdfUrl);
            await recordToUpdate.save();
            console.log(`✅ PDF URL saved to financial record ${recordToUpdate._id}: ${pdfUrl}`);
          }
        } else {
          console.warn(`⚠️ No financial record found for order ${order._id}, PDF URL not saved`);
          console.warn(`⚠️ Attempted to find by orderId: ${order._id}, invoiceId: ${order.invoiceId || 'N/A'}`);
        }
      } catch (saveError) {
        console.error("❌ Error saving PDF URL to financial record:", saveError.message);
        console.error("❌ Save error stack:", saveError.stack);
        // Don't throw - email was sent successfully
      }
    } else if (!pdfUrl && pdfBuffer) {
      // PDF was generated but URL is missing - try to upload it
      try {
        console.log(`📤 PDF buffer exists but URL is missing. Uploading to Cloudinary...`);
        const pdfBase64 = pdfBuffer.toString('base64');
        const uploadResult = await uploadToCloudinaryFile(pdfBase64);
        pdfUrl = uploadResult.secure_url;
        console.log(`✅ Order PDF uploaded to Cloudinary: ${pdfUrl}`);
        
        // Now try to save it to financial record
        let recordToUpdate = financialRecord;
        if (!recordToUpdate && order._id) {
          recordToUpdate = await Finance.findOne({ orderId: order._id });
        }
        if (!recordToUpdate && order.invoiceId) {
          recordToUpdate = await Finance.findOne({ invoiceId: order.invoiceId });
        }
        
        if (recordToUpdate && pdfUrl) {
          recordToUpdate.attachmentURL = Array.isArray(recordToUpdate.attachmentURL) 
            ? recordToUpdate.attachmentURL 
            : [];
          if (!recordToUpdate.attachmentURL.includes(pdfUrl)) {
            recordToUpdate.attachmentURL.push(pdfUrl);
            await recordToUpdate.save();
            console.log(`✅ PDF URL saved to financial record ${recordToUpdate._id}: ${pdfUrl}`);
          }
        }
      } catch (retryError) {
        console.error("❌ Error uploading/saving PDF after retry:", retryError.message);
      }
    }

  } catch (error) {
    console.error("❌ Error sending order summary email:", error);
    console.error("❌ Error message:", error.message);
    // Don't throw - email failure shouldn't break order creation
  }
};

/**
 * Create order from invoice
 */
export const createOrderFromInvoice = async (req, res) => {
  try {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decodedToken?.companyId;
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: "Invoice ID is required" });
    }

    // Get invoice with populated data
    const invoice = await Invoice.findById(invoiceId)
      .populate("customerId", "name email phone address")
      .populate("companyId", "name email phone address logo");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    if (!invoice.customerId) {
      return res.status(400).json({ success: false, message: "Invoice must have a customer to create order" });
    }

    // Convert invoice items to order items
    const orderItems = [];
    for (const invoiceItem of invoice.items) {
      // Try to find product by description or create a reference
      const product = await Product.findOne({
        $or: [
          { productName: invoiceItem.description },
          { name: invoiceItem.description }
        ],
        companyId: companyId
      });

      if (!product) {
        console.warn(`⚠️ Product not found for item: ${invoiceItem.description}, creating order item without product reference`);
      }

      orderItems.push({
        product: product?._id || null,
        quantity: invoiceItem.quantity || 1,
        unitPrice: invoiceItem.unitPrice || 0,
        discount: invoiceItem.discount || 0,
        totalPrice: invoiceItem.total || 0,
      });
    }

    // Create order
    const order = new CustomerOrder({
      customer: invoice.customerId._id,
      companyId: invoice.companyId._id,
      orderDate: invoice.issueDate || new Date(),
      deliveryDate: invoice.dueDate || null,
      items: orderItems,
      orderTotal: invoice.totalAmount || 0,
      globalDiscount: invoice.globalDiscount?.value || 0,
      taxRate: invoice.taxRate || 0,
      taxAmount: invoice.taxAmount || 0,
      status: "Pending",
      notes: `Order created from invoice ${invoice.invoiceNumber}`,
    });

    await order.save();
    console.log(`✅ Order ${order._id} created from invoice ${invoice.invoiceNumber}`);

    // Populate order for email
    const populatedOrder = await CustomerOrder.findById(order._id)
      .populate("customer", "name email phone address")
      .populate("companyId", "name email phone address logo")
      .populate("items.product", "productName name");

    // Create or update financial record
    let financialRecord = await Finance.findOne({ invoiceId: invoice._id });
    
    if (!financialRecord) {
      // Create new financial record
      financialRecord = new Finance({
        companyId: companyId,
        transactionDate: order.orderDate || new Date(),
        transactionType: "Income",
        transactionAmount: order.orderTotal || 0,
        transactionCurrency: invoice.currency || "USD",
        transactionDescription: `Order #${order._id} - Invoice ${invoice.invoiceNumber}`,
        category: "Sales",
        bankAccount: "Default",
        transactionStatus: "Pending",
        recordType: "customer",
        partyId: order.customer,
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice._id,
        paymentTerms: order.paymentTerms || invoice.paymentTerms || "Net 30",
        orderId: order._id,
        otherDetails: JSON.stringify({
          orderTotal: order.orderTotal,
          taxAmount: order.taxAmount || 0,
          taxRate: order.taxRate || 0,
          globalDiscount: order.globalDiscount || 0,
        }),
      });
      await financialRecord.save();
      console.log(`✅ Financial record ${financialRecord._id} created for order ${order._id}`);
    } else {
      // Update existing financial record with order ID
      financialRecord.orderId = order._id;
      await financialRecord.save();
      console.log(`✅ Financial record ${financialRecord._id} updated with order ${order._id}`);
    }

    // Send order summary email with PDF
    try {
      await sendOrderSummaryEmail(populatedOrder, financialRecord);
    } catch (emailError) {
      console.error("❌ Error sending order summary email (order still created):", emailError.message);
      // Don't fail order creation if email fails
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully from invoice",
      data: {
        order: populatedOrder,
        financialRecord: {
          id: financialRecord._id,
          attachmentURL: financialRecord.attachmentURL
        }
      }
    });

  } catch (error) {
    console.error("Error creating order from invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating order from invoice",
      error: error.message,
    });
  }
};

// Create a new customer order
export const createCustomerOrder = async (req, res) => {
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
    const employeeId = decodedToken?.employeeId;
    const {
      customer,
      deliveryDate,
      items,
      globalDiscount = 0,
      taxRate = 0,
      notes,
      paymentTerms = "Net 30",
      leadId,
      projectId,
      shippingAddress,
      contactPhone,
    } = req.body;
    console.log("Received customer order data:", req.body);

    // Validate required fields
    if (!customer || !companyId || !items || !items.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Helper function to get price from price list or product
    const getItemPrice = async (productId, customerId, quantity) => {
      // First, try to get price from active price list
      const queryDate = new Date();
      const filter = {
        companyId: companyId,
        priceListType: "Customer",
        status: "Active",
        startDate: { $lte: queryDate },
        $or: [
          { endDate: { $gte: queryDate } },
          { endDate: null }
        ],
        "items.productId": productId
      };

      if (customerId) {
        filter.$or = [
          { customerId: customerId },
          { customerId: null } // General customer price list
        ];
      }

      const priceLists = await PriceList.find(filter)
        .sort({ customerId: -1, startDate: -1 })
        .limit(5);

      for (const priceList of priceLists) {
        const priceItem = priceList.items.find(i => 
          i.productId.toString() === productId.toString()
        );

        if (priceItem) {
          // Check quantity breaks
          if (priceItem.quantityBreaks && priceItem.quantityBreaks.length > 0) {
            const sortedBreaks = [...priceItem.quantityBreaks].sort((a, b) => 
              (b.minQuantity || 0) - (a.minQuantity || 0)
            );

            for (const breakPrice of sortedBreaks) {
              if (quantity >= breakPrice.minQuantity) {
                if (!breakPrice.maxQuantity || quantity <= breakPrice.maxQuantity) {
                  return breakPrice.price;
                }
              }
            }
          }

          // Return base price
          return priceItem.basePrice;
        }
      }

      // Fallback to product unitPrice
      const productDoc = await Product.findById(productId);
      return productDoc?.unitPrice || 0;
    };

    // Recalculate each order item (using price list or product unitPrice)
    let computedItems = [];
    let computedOrderTotal = 0;

    for (const item of items) {
      // Fetch the product to validate it exists
      const productDoc = await Product.findById(item.product);
      if (!productDoc) {
        return res
          .status(400)
          .json({ message: `Invalid product: ${item.product}` });
      }

      // Get price from price list if available, otherwise use product unitPrice
      // If unitPrice is provided in request (from frontend), use it (it's already from price list)
      let unitPrice = item.unitPrice;
      if (!unitPrice || unitPrice <= 0) {
        unitPrice = await getItemPrice(item.product, customer, Number(item.quantity));
      }

      // Use global discount if provided; otherwise, use item discount
      const discount = globalDiscount > 0 ? 0 : Number(item.discount) || 0;
      const discountedUnitPrice = unitPrice * (1 - discount / 100);
      const totalPrice = discountedUnitPrice * Number(item.quantity);

      computedItems.push({
        product: item.product,
        quantity: Number(item.quantity),
        unitPrice,
        discount,
        totalPrice,
      });
      computedOrderTotal += totalPrice;
    }

    // Apply global discount if set
    if (globalDiscount > 0) {
      computedOrderTotal =
        computedOrderTotal * (1 - Number(globalDiscount) / 100);
    }

    // Calculate tax amount
    const finalTaxRate = Number(taxRate) || 0;
    const taxAmount = (computedOrderTotal * finalTaxRate) / 100;
    
    // Calculate final total (subtotal after discount + tax)
    const finalOrderTotal = computedOrderTotal + taxAmount;

    const normalizedShippingAddress =
      normalizeOrderShippingAddress(shippingAddress);
    const contactPhoneValue =
      (typeof contactPhone === "string" ? contactPhone.trim() : "") ||
      normalizedShippingAddress?.contactPhone ||
      "";

    // Create and save the order FIRST
    const order = new CustomerOrder({
      customer,
      companyId,
      orderDate: new Date(),
      deliveryDate,
      items: computedItems,
      globalDiscount: Number(globalDiscount),
      taxRate: finalTaxRate,
      taxAmount: taxAmount,
      orderTotal: finalOrderTotal,
      notes,
      paymentTerms: paymentTerms || "Net 30",
      ...(leadId && { leadId }),
      ...(projectId && { projectId }),
      ...(normalizedShippingAddress && { shippingAddress: normalizedShippingAddress }),
      ...(contactPhoneValue && { contactPhone: contactPhoneValue }),
    });

    const savedOrder = await order.save();
    console.log(`✅ Order saved successfully: ${savedOrder._id}`);

    // Link order to lead and project if provided
    if (leadId) {
      await linkOrderToLead(savedOrder._id, leadId);
    }
    if (projectId) {
      await linkOrderToProject(savedOrder._id, projectId);
    }

    // Get customer and department info for notifications
    const customerDoc = await Customer.findById(customer).populate("companyId");
    let departmentId = null;
    if (projectId) {
      const orderProject = await Project.findById(projectId).populate("departmentId");
      departmentId = orderProject?.departmentId?._id || orderProject?.departmentId || null;
    }

    // Create automatic notifications
    try {
      // Notify department managers
      if (departmentId) {
        const department = await Department.findById(departmentId).populate("departmentManager");
        if (department?.departmentManager) {
          await Notification.create({
            companyId,
            employeeId: department.departmentManager._id,
            title: "🛒 הזמנה חדשה התקבלה",
            content: `הזמנה חדשה בסך ${finalOrderTotal.toFixed(2)} ${customerDoc?.companyId?.currency || "ILS"} התקבלה מלקוח ${customerDoc?.name || "לא ידוע"}`,
            type: "Info",
            category: "customers",
            priority: "medium",
            relatedEntity: {
              entityType: "CustomerOrder",
              entityId: savedOrder._id.toString(),
            },
            actionUrl: `/dashboard/Customers/Orders/${savedOrder._id}`,
            actionLabel: "צפה בהזמנה",
          });
        }
      }

      // Notify project manager if order is linked to project
      if (projectId) {
        const project = await Project.findById(projectId).populate("projectManager");
        if (project?.projectManager) {
          await Notification.create({
            companyId,
            employeeId: project.projectManager._id,
            title: "📦 הזמנה חדשה לפרויקט",
            content: `הזמנה חדשה בסך ${finalOrderTotal.toFixed(2)} ${customerDoc?.companyId?.currency || "ILS"} התקבלה עבור הפרויקט "${project.name}"`,
            type: "Info",
            category: "projects",
            priority: "medium",
            relatedEntity: {
              entityType: "CustomerOrder",
              entityId: savedOrder._id.toString(),
            },
            actionUrl: `/dashboard/Customers/Orders/${savedOrder._id}`,
            actionLabel: "צפה בהזמנה",
          });
        }
      }

      // Notify sales managers if order is linked to lead
      if (leadId) {
        const lead = await Lead.findById(leadId).populate("assignedTo");
        if (lead?.assignedTo && lead.assignedTo.length > 0) {
          for (const assignedEmployee of lead.assignedTo) {
            await Notification.create({
              companyId,
              employeeId: assignedEmployee._id || assignedEmployee,
              title: "✅ הזמנה נוצרה מליד",
              content: `הזמנה חדשה בסך ${finalOrderTotal.toFixed(2)} ${customerDoc?.companyId?.currency || "ILS"} נוצרה מהליד "${lead.name}"`,
              type: "Success",
              category: "customers",
              priority: "medium",
              relatedEntity: {
                entityType: "CustomerOrder",
                entityId: savedOrder._id.toString(),
              },
              actionUrl: `/dashboard/Customers/Orders/${savedOrder._id}`,
              actionLabel: "צפה בהזמנה",
            });
          }
        }
      }

      // Notify admins and managers
      const adminsAndManagers = await Employee.find({
        companyId,
        role: { $in: ["Admin", "Manager"] },
        status: "active",
      }).select("_id");

      for (const admin of adminsAndManagers) {
        await Notification.create({
          companyId,
          employeeId: admin._id,
          title: "🛒 הזמנה חדשה",
          content: `הזמנה חדשה בסך ${finalOrderTotal.toFixed(2)} ${customerDoc?.companyId?.currency || "ILS"} התקבלה`,
          type: "Info",
          category: "customers",
          priority: "low",
          relatedEntity: {
            entityType: "CustomerOrder",
            entityId: savedOrder._id.toString(),
          },
          actionUrl: `/dashboard/Customers/Orders/${savedOrder._id}`,
          actionLabel: "צפה בהזמנה",
        });
      }
    } catch (notificationError) {
      console.error("❌ Error creating notifications (order still created):", notificationError);
    }

    // Create production orders automatically for products that need manufacturing
    let productionOrders = [];
    try {
      console.log(`🏭 Checking if production orders are needed for order: ${savedOrder._id}`);
      productionOrders = await createProductionOrderFromCustomerOrder(savedOrder);
      if (productionOrders.length > 0) {
        console.log(`✅ Created ${productionOrders.length} production order(s) for customer order ${savedOrder._id}`);
      } else {
        console.log(`ℹ️ No production orders needed for order ${savedOrder._id} (all products have sufficient stock or no BOM)`);
      }
    } catch (productionError) {
      console.error("❌ Error creating production orders (order still created):", productionError);
      // Don't fail order creation if production order creation fails
    }

    // Create invoice and financial record automatically
    let invoice = null;
    let financialRecord = null;
    let invoiceError = null;
    
    try {
      console.log(`📝 Creating invoice and financial record for order: ${savedOrder._id}`);
      
      // Create invoice from order
      console.log(`🔵 Step 1: Creating invoice...`);
      invoice = await createInvoiceFromOrder(savedOrder, companyId, decodedToken);
      console.log(`✅ Step 1: Invoice created successfully: ${invoice.invoiceNumber} (ID: ${invoice._id})`);
      
      // Create financial record from order and invoice
      console.log(`🔵 Step 2: Creating financial record...`);
      if (!invoice || !invoice._id) {
        throw new Error("Invoice was not created successfully - missing invoice ID");
      }
      financialRecord = await createFinancialRecordFromOrder(savedOrder, invoice, companyId);
      console.log(`✅ Step 2: Financial record created successfully: ${financialRecord._id}`);
      
      // Populate order for email
      const populatedOrder = await CustomerOrder.findById(savedOrder._id)
        .populate("customer", "name email phone address")
        .populate("companyId", "name email phone address logo")
        .populate("items.product", "productName name");
      
      // Send order summary email with PDF
      try {
        console.log(`🔵 Step 3: Sending order summary email...`);
        await sendOrderSummaryEmail(populatedOrder, financialRecord);
        console.log(`✅ Step 3: Order summary email sent successfully`);
      } catch (emailError) {
        console.error("❌ Error sending order summary email (order still created):", emailError.message);
        // Don't fail order creation if email fails
      }
      
      // Update the response to include invoice and financial record info
      return res.status(201).json({ 
        success: true, 
        data: {
          order: savedOrder,
          invoice: {
            id: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            totalAmount: invoice.totalAmount
          },
          financialRecord: {
            id: financialRecord._id,
            transactionAmount: financialRecord.transactionAmount,
            attachmentURL: financialRecord.attachmentURL
          }
        }
      });
    } catch (error) {
      invoiceError = error;
      // Log detailed error information
      console.error("❌ Error creating invoice/financial record:");
      console.error("❌ Error type:", error.constructor.name);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error stack:", error.stack);
      
      // If invoice was created but financial record failed, create financial record without invoice link
      if (invoice && invoice._id && !financialRecord) {
        try {
          console.log(`⚠️ Invoice was created but financial record failed. Creating financial record without invoice link...`);
          financialRecord = await createFinancialRecordFromOrderWithoutInvoice(savedOrder, companyId);
          console.log(`✅ Financial record created without invoice link: ${financialRecord._id}`);
        } catch (frError) {
          console.error("❌ Failed to create financial record without invoice:", frError.message);
        }
      }
      
      // Try to send order summary email even if invoice/financial record creation failed
      if (savedOrder) {
        try {
          // Populate order for email
          const populatedOrder = await CustomerOrder.findById(savedOrder._id)
            .populate("customer", "name email phone address")
            .populate("companyId", "name email phone address logo")
            .populate("items.product", "productName name");
          
          console.log(`🔵 Sending order summary email (after error)...`);
          await sendOrderSummaryEmail(populatedOrder, financialRecord || null);
          console.log(`✅ Order summary email sent successfully`);
        } catch (emailError) {
          console.error("❌ Error sending order summary email:", emailError.message);
          // Don't fail order creation if email fails
        }
      }
      
      // Return success for the order with detailed error info
      return res.status(201).json({ 
        success: true, 
        data: savedOrder,
        invoiceCreated: invoice ? true : false,
        invoiceId: invoice?._id || null,
        invoiceNumber: invoice?.invoiceNumber || null,
        financialRecordCreated: financialRecord ? true : false,
        financialRecordId: financialRecord?._id || null,
        error: {
          message: error.message,
          code: error.code,
          type: error.constructor.name
        },
        warning: invoice 
          ? "Invoice created but financial record creation had issues. Please check manually."
          : "Order created successfully, but invoice/financial record creation failed. Please create manually."
      });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// Get all customer orders
export const getCustomerOrders = async (req, res) => {
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
    const orders = await CustomerOrder.find({ companyId })
      .populate("customer", "name")
      .populate("items.product", "productName");
    console.log("Orders:", orders);
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// Get a single customer order by its ID
export const getCustomerOrderById = async (req, res) => {
  try {
    const order = await CustomerOrder.findById(req.params.id)
      .populate("customer")
      .populate("companyId")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// Update an existing customer order by its ID
export const updateCustomerOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const {
      customer,
      companyId,
      deliveryDate,
      items,
      globalDiscount = 0,
      taxRate = 0,
      notes,
      shippingAddress,
      contactPhone,
    } = req.body;

    let computedItems = [];
    let computedOrderTotal = 0;

    if (items && items.length > 0) {
      for (const item of items) {
        // טעינת מידע על המוצר
        const productDoc = await Product.findById(item.product);
        if (!productDoc) {
          return res
            .status(400)
            .json({ message: `Invalid product: ${item.product}` });
        }

        const unitPrice = productDoc.unitPrice;
        const discount =
          Number(globalDiscount) > 0 ? 0 : Number(item.discount) || 0;
        const discountedUnitPrice = unitPrice * (1 - discount / 100);
        const totalPrice = discountedUnitPrice * Number(item.quantity);

        // שמירת isAllocated אם נשלח, אחרת False
        const isAllocated =
          typeof item.isAllocated === "boolean" ? item.isAllocated : false;

        computedItems.push({
          product: item.product,
          quantity: Number(item.quantity),
          unitPrice,
          discount,
          totalPrice: totalPrice.toFixed(3),
          isAllocated,
        });
        computedOrderTotal += totalPrice;
      }
    }

    // הנחה גלובלית
    if (Number(globalDiscount) > 0) {
      computedOrderTotal =
        computedOrderTotal * (1 - Number(globalDiscount) / 100);
    }

    // Calculate tax amount
    const finalTaxRate = Number(taxRate) || 0;
    const taxAmount = (computedOrderTotal * finalTaxRate) / 100;
    
    // Calculate final total (subtotal after discount + tax)
    const finalOrderTotal = computedOrderTotal + taxAmount;

    const normalizedShippingAddress =
      normalizeOrderShippingAddress(shippingAddress);
    const contactPhoneValue =
      (typeof contactPhone === "string" ? contactPhone.trim() : "") ||
      normalizedShippingAddress?.contactPhone ||
      "";

    // החלפת מערך items בהזמנה
    const updatedOrder = await CustomerOrder.findByIdAndUpdate(
      orderId,
      {
        customer,
        companyId,
        deliveryDate,
        items: computedItems,
        globalDiscount: Number(globalDiscount),
        taxRate: finalTaxRate,
        taxAmount: taxAmount,
        orderTotal: finalOrderTotal,
        notes,
        ...(normalizedShippingAddress && {
          shippingAddress: normalizedShippingAddress,
        }),
        ...(contactPhoneValue && { contactPhone: contactPhoneValue }),
      },
      { new: true }
    )
      .populate("items.product", "productName")
      .populate("customer", "name");
    
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

// מחיקת הזמנה
export const deleteCustomerOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await CustomerOrder.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

export const getUnallocatedOrders = async (req, res) => {
  try {
    // אימות
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const companyId = decodedToken.companyId;

    // שליפת כל ההזמנות של החברה שיש בהן לפחות פריט אחד לא מוקצה
    // באמצעות התנאי "items.isAllocated": false
    const orders = await CustomerOrder.find({
      companyId,
      "items.isAllocated": false,
    })
      .populate("customer", "name")
      .populate("items.product", "productName");

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching unallocated orders:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};
