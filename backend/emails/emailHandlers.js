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

export function createProcurementEmail(supplierName, companyName, purchaseOrderUrl) {
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
export function createProcurementUpdateEmail(supplierName, companyName, procurementOrderId) {
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
