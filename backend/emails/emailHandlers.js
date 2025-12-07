export function createCompanyRegistrationEmail(company, Name) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Company Registration Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px; border-radius: 10px;"/>
        <h1 style="color: white; margin: 0; font-size: 28px;">Company ${company} Registration Successful</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #0077B5;"><strong>Hello,</strong></p>
        <p>We are pleased to inform you that your company, <strong>${company}</strong>, has been successfully registered on UnLinked.</p>
        <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${Name},</strong></p>
        <p>Your company is currently under review, and you will be notified once the approval process is completed. We appreciate your patience and will process your request as quickly as possible.</p>
        <p>Once approved, you will receive further instructions on how to manage your company account.</p>
        <p>Thank you for choosing UnLinked. If you have any questions or need assistance, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The UnLinked Team</p>
      </div>
    </body>
    </html>
  `;
}

export function createCompanyApprovalEmail(companyName, profileUrl) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Company Approval Notification</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px; border-radius: 10px;"/>
      <h1 style="color: white; margin: 0; font-size: 28px;">Company Approved!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #0077B5;"><strong>Congratulations,</strong></p>
      <p>Your company <strong>${companyName}</strong> has been successfully approved! You can now sign up as a manager to start managing your company's operations on UnLinked.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${profileUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Sign Up as Manager</a>
      </div>
      <p>Once you sign up, you’ll have access to advanced features such as managing employees, tracking projects, and monitoring company performance.</p>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>The UnLinked Team</p>
    </div>
  </body>
  </html>
  `;
}

export function createSuccessfulRegistration(userName, profileUrl) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Successful Registration</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px; border-radius: 10px;"/>
      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to UnLinked!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${userName},</strong></p>
      <p>Your registration was successful! You can now log in to your personal dashboard and start exploring all the tools and features we offer.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${profileUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Go to Dashboard</a>
      </div>
      <p>If you have any questions or need assistance, our support team is here to help.</p>
      <p>Best regards,<br>The UnLinked Team</p>
    </div>
  </body>
  </html>
  `;
}
export function createRegistrationEmployee(companyName, companyUrl) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Successful Registration</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #0077B5, #00A0DC); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px; border-radius: 10px;"/>
      <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to UnLinked!</h1>
    </div>
    <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #0077B5;"><strong>Hello ${companyName},</strong></p>
      <p>Your company registration was successful! You can now log in to your company dashboard and start managing all the tools and features we offer.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${companyUrl}" style="background-color: #0077B5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Go to Company Dashboard</a>
      </div>
      <p>If you have any questions or need assistance, our support team is here to help.</p>
      <p>Best regards,<br>The UnLinked Team</p>
    </div>
  </body>
  </html>
  `;
}

export function createCombinedWelcomeInvoiceEmail(companyName, invoice) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation & Welcome</title>
    </head>
    <body>
      <h1>Welcome, ${companyName}!</h1>
      <p>Thank you for your payment. Below are your invoice details:</p>
      <ul>
        <li>Plan: ${invoice.planName}</li>
        <li>Amount: ${invoice.amount} ${invoice.currency}</li>
        <li>Payment Date: ${new Date(
          invoice.paymentDate
        ).toLocaleDateString()}</li>
      </ul>
      <p>You can download your invoice here: <a href="${
        invoice.invoicePdfUrl
      }" target="_blank">Download Invoice</a></p>
      <p>We look forward to working with you!</p>
    </body>
    </html>
  `;
}

export function createSubscriptionEndingEmail(company, name) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Ending Soon</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #FF4500, #FF6347); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px; border-radius: 10px;"/>
        <h1 style="color: white; margin: 0; font-size: 28px;">Your Subscription is Ending Soon</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #FF4500;"><strong>Hello ${name},</strong></p>
        <p>We wanted to remind you that your subscription for <strong>${company}</strong> is set to expire in one week.</p>
        <p>To ensure uninterrupted access to all our services, we recommend renewing your subscription as soon as possible.</p>
        <p>Click the link below to renew your subscription:</p>
        <p style="text-align: center;">
          <a href="https://www.unlinked.com/renew-subscription" style="background-color: #FF4500; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">Renew Now</a>
        </p>
        <p>If you have any questions or need assistance, our support team is here to help.</p>
        <p>Thank you for being a valued part of the UnLinked community.</p>
        <p>Best regards,<br>The UnLinked Team</p>
      </div>
    </body>
    </html>
  `;
}

export function createPaymentFailedEmail(companyName, amount, invoiceUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #DC143C, #FF6347); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg" alt="UnLinked Logo" style="width: 150px; margin-bottom: 20px; border-radius: 10px;"/>
        <h1 style="color: white; margin: 0; font-size: 28px;">Payment Failed</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #DC143C;"><strong>Hello,</strong></p>
        <p>We were unable to process your payment for <strong>${companyName}</strong>.</p>
        <p style="background-color: #FFF3CD; padding: 15px; border-radius: 5px; border-left: 4px solid #FFC107;">
          <strong>Amount:</strong> $${amount.toFixed(2)}<br>
          <strong>Status:</strong> Payment Failed
        </p>
        <p>This could be due to:</p>
        <ul>
          <li>Insufficient funds in your account</li>
          <li>Expired payment method</li>
          <li>Card declined by your bank</li>
          <li>Payment method needs to be updated</li>
        </ul>
        <p>Please update your payment method to continue using our services without interruption.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceUrl || 'https://www.unlinked.com/update-payment'}" style="background-color: #DC143C; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">Update Payment Method</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you have any questions or need assistance, please contact our support team immediately.</p>
        <p>Best regards,<br>The UnLinked Team</p>
      </div>
    </body>
    </html>
  `;
}

export function createProcurementEmail(
  supplierName,
  companyName,
  purchaseOrderUrl
) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Procurement Order</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #4CAF50, #8BC34A); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Purchase Order</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #4CAF50;"><strong>Hello ${supplierName},</strong></p>
        <p>We are pleased to share the purchase order from <strong>${companyName}</strong>.</p>
        <p>You can download the purchase order using the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${purchaseOrderUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">Download Purchase Order</a>
        </div>
        <p>If you have any questions or need further assistance, please feel free to contact us.</p>
        <p>Best regards,<br>The ${companyName} Team</p>
      </div>
    </body>
    </html>
  `;
}
export function createProcurementUpdateEmail(
  supplierName,
  companyName,
  procurementOrderId
) {
  const updateUrl = `http://localhost:5173/supplier/updateProcurement/${procurementOrderId}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Procurement Order Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #FF9800, #FFC107); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Procurement Order Update</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #FF9800;"><strong>Hello ${supplierName},</strong></p>
        <p>We want to inform you that there has been an update to the procurement order from <strong>${companyName}</strong>.</p>
        <p>You can view and update the procurement details using the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${updateUrl}" style="background-color: #FF9800; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View and Update Procurement Order</a>
        </div>
        <p>If you have any questions or need further assistance, please feel free to contact us.</p>
        <p>Best regards,<br>The ${companyName} Team</p>
      </div>
    </body>
    </html>
  `;
}
export function createProcurementDiscrepancyEmail(
  supplierName,
  companyName,
  orderNumber,
  discrepancies
) {
  // Generate table rows for each product discrepancy
  const discrepancyRows = discrepancies
    .map(
      (product) => `
    <tr>
      <td class="border border-gray-300 px-4 py-2">${product.productName}</td>
      <td class="border border-gray-300 px-4 py-2 text-center">${product.orderedQuantity}</td>
      <td class="border border-gray-300 px-4 py-2 text-center">${product.receivedQuantity}</td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Procurement Order Update</title>
      <!-- Include Tailwind CSS via CDN -->
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 font-sans">
      <div class="max-w-2xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <!-- Header Section -->
        <div class="bg-green-600 text-white text-center py-4">
          <h1 class="text-2xl font-bold">Procurement Order Update</h1>
        </div>
        
        <!-- Body Section -->
        <div class="p-6">
          <!-- Greeting -->
          <p class="text-lg mb-2"><strong>Hello ${supplierName},</strong></p>
          
          <!-- Introduction -->
          <p class="mb-2">We would like to inform you that the received quantity for Purchase Order <strong>${orderNumber}</strong> from <strong>${companyName}</strong> is lower than the ordered quantity.</p>
          
          <!-- Discrepancy Details -->
          <p class="mb-4">Below are the details of the discrepancies:</p>
          
          <!-- Discrepancy Table -->
          <table class="min-w-full table-auto mb-6">
            <thead>
              <tr class="bg-green-100">
                <th class="px-4 py-2">Product Name</th>
                <th class="px-4 py-2">Ordered Quantity</th>
                <th class="px-4 py-2">Received Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${discrepancyRows}
            </tbody>
          </table>
          
          
          <p class="mt-6">If you have any questions or need further assistance, please do not hesitate to contact us.</p>
          <p class="mt-4">Best regards,<br>The <strong>${companyName}</strong> Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create payment invoice email template with Nexora logo
 */
export function createPaymentInvoiceEmail(companyName, invoice, invoicePdfUrl, logoUrl = null) {
  // Use provided logo URL or default Nexora logo
  const defaultLogoUrl = logoUrl || "https://via.placeholder.com/150x80/667eea/ffffff?text=Nexora";
  
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .logo {
          max-width: 150px;
          max-height: 80px;
          margin-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .invoice-info {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .invoice-info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .invoice-info-row:last-child {
          border-bottom: none;
        }
        .invoice-info-label {
          font-weight: bold;
          color: #666;
        }
        .invoice-info-value {
          color: #333;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .invoice-details {
          background-color: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .invoice-details h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        .plan-name {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          margin: 10px 0;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #764ba2;
          margin: 15px 0;
        }
        .thank-you {
          text-align: center;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${defaultLogoUrl}" alt="Nexora Logo" class="logo" />
          <h1>תודה על התשלום!</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #333;"><strong>שלום ${companyName},</strong></p>
          
          <p>תודה על התשלום שלך! אנו מודים לך על השימוש בפלטפורמת Nexora.</p>
          
          <div class="invoice-info">
            <div class="invoice-info-row">
              <span class="invoice-info-label">מספר חשבונית:</span>
              <span class="invoice-info-value">${invoice.invoiceNumber}</span>
            </div>
            <div class="invoice-info-row">
              <span class="invoice-info-label">תאריך:</span>
              <span class="invoice-info-value">${new Date(invoice.issueDate).toLocaleDateString('he-IL')}</span>
            </div>
            <div class="invoice-info-row">
              <span class="invoice-info-label">תוכנית:</span>
              <span class="invoice-info-value">${invoice.items?.[0]?.description?.match(/(Basic|Pro|Enterprise)/)?.[0] || 'N/A'}</span>
            </div>
            <div class="invoice-info-row">
              <span class="invoice-info-label">משך זמן:</span>
              <span class="invoice-info-value">${invoice.items?.[0]?.description?.match(/(Monthly|Quarterly|Yearly)/)?.[0] || 'N/A'}</span>
            </div>
            <div class="invoice-info-row">
              <span class="invoice-info-label">סכום כולל:</span>
              <span class="invoice-info-value" style="font-size: 20px; font-weight: bold; color: #764ba2;">${invoice.currency || 'USD'} ${invoice.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <div class="invoice-details">
            <h3>פרטי החשבונית</h3>
            <div class="plan-name">${invoice.items?.[0]?.description || 'Subscription Invoice'}</div>
            <p><strong>כמות:</strong> ${invoice.items?.[0]?.quantity || 1}</p>
            <p><strong>מחיר ליחידה:</strong> ${invoice.currency || 'USD'} ${invoice.items?.[0]?.unitPrice?.toFixed(2) || '0.00'}</p>
            ${invoice.items?.[0]?.discount > 0 ? `<p><strong>הנחה:</strong> ${invoice.items[0].discount}%</p>` : ''}
            ${invoice.taxAmount > 0 ? `<p><strong>מע"מ (${invoice.taxRate}%):</strong> ${invoice.currency || 'USD'} ${invoice.taxAmount.toFixed(2)}</p>` : ''}
            <div class="amount">סה"כ: ${invoice.currency || 'USD'} ${invoice.totalAmount?.toFixed(2) || '0.00'}</div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoicePdfUrl}" class="button">הורד חשבונית PDF</a>
          </div>
          
          <div class="thank-you">
            <p style="font-size: 18px; color: #667eea; margin: 0;"><strong>תודה שתמכת בנו!</strong></p>
            <p style="margin: 10px 0 0 0;">אנו מצפים להמשך שיתוף פעולה פורה.</p>
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            אם יש לך שאלות או זקוק לעזרה, צוות התמיכה שלנו כאן בשבילך.
          </p>
          
          <p style="color: #666;">
            בברכה,<br>
            <strong>צוות Nexora</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexora. כל הזכויות שמורות.</p>
          <p>מייל זה נשלח אוטומטית, אנא אל תגיב עליו.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}


/**
 * Create order summary email template with Nexora logo
 */
export function createOrderSummaryEmail(companyName, order, orderPdfUrl, logoUrl = null) {
  const defaultLogoUrl = logoUrl || "https://via.placeholder.com/150x80/667eea/ffffff?text=Nexora";
  
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Summary - ${order._id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .logo {
          max-width: 150px;
          max-height: 80px;
          margin-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .order-info {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .order-info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .order-info-row:last-child {
          border-bottom: none;
        }
        .order-info-label {
          font-weight: bold;
          color: #666;
        }
        .order-info-value {
          color: #333;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .order-details {
          background-color: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .order-details h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #764ba2;
          margin: 15px 0;
        }
        .thank-you {
          text-align: center;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${defaultLogoUrl}" alt="Nexora Logo" class="logo" />
          <h1>סיכום הזמנה</h1>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #333;"><strong>שלום ${companyName},</strong></p>
          
          <p>תודה על ההזמנה שלך! אנו מודים לך על השימוש בפלטפורמת Nexora.</p>
          
          <div class="order-info">
            <div class="order-info-row">
              <span class="order-info-label">מספר הזמנה:</span>
              <span class="order-info-value">${order._id}</span>
            </div>
            <div class="order-info-row">
              <span class="order-info-label">תאריך הזמנה:</span>
              <span class="order-info-value">${new Date(order.orderDate).toLocaleDateString('he-IL')}</span>
            </div>
            ${order.deliveryDate ? `
            <div class="order-info-row">
              <span class="order-info-label">תאריך משלוח:</span>
              <span class="order-info-value">${new Date(order.deliveryDate).toLocaleDateString('he-IL')}</span>
            </div>
            ` : ''}
            <div class="order-info-row">
              <span class="order-info-label">סטטוס:</span>
              <span class="order-info-value">${order.status || 'Pending'}</span>
            </div>
            <div class="order-info-row">
              <span class="order-info-label">סכום כולל:</span>
              <span class="order-info-value" style="font-size: 20px; font-weight: bold; color: #764ba2;">USD ${order.orderTotal?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          
          <div class="order-details">
            <h3>פרטי ההזמנה</h3>
            <p><strong>מספר פריטים:</strong> ${order.items?.length || 0}</p>
            ${order.globalDiscount > 0 ? `<p><strong>הנחה כוללת:</strong> ${order.globalDiscount}%</p>` : ''}
            ${order.taxRate > 0 ? `<p><strong>מע"מ (${order.taxRate}%):</strong> USD ${order.taxAmount?.toFixed(2) || '0.00'}</p>` : ''}
            <div class="amount">סה"כ: USD ${order.orderTotal?.toFixed(2) || '0.00'}</div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${orderPdfUrl}" class="button">הורד סיכום הזמנה PDF</a>
          </div>
          
          <div class="thank-you">
            <p style="font-size: 18px; color: #667eea; margin: 0;"><strong>תודה שתמכת בנו!</strong></p>
            <p style="margin: 10px 0 0 0;">אנו מצפים להמשך שיתוף פעולה פורה.</p>
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            אם יש לך שאלות או זקוק לעזרה, צוות התמיכה שלנו כאן בשבילך.
          </p>
          
          <p style="color: #666;">
            בברכה,<br>
            <strong>צוות Nexora</strong>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexora. כל הזכויות שמורות.</p>
          <p>מייל זה נשלח אוטומטית, אנא אל תגיב עליו.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}


export function createSupplierInvoiceEmail(
  supplierName,
  companyName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  totalAmount,
  currency,
  invoiceUrl
) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Supplier Invoice</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #2196F3, #03A9F4); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Supplier Invoice</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 18px; color: #2196F3;"><strong>Hello ${supplierName},</strong></p>
        <p>We are pleased to share the invoice details from <strong>${companyName}</strong>.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date(invoiceDate).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${totalAmount.toLocaleString()} ${currency}</p>
        </div>
        ${invoiceUrl ? `
        <p>You can view the full invoice details using the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceUrl}" style="background-color: #2196F3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">View Invoice</a>
        </div>
        ` : ''}
        <p>If you have any questions or need further assistance, please feel free to contact us.</p>
        <p>Best regards,<br>The ${companyName} Team</p>
      </div>
    </body>
    </html>
  `;
}
