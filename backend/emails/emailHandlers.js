/**
 * תבנית בסיסית אחידה לכל המיילים
 */
const getEmailTemplate = (title, content, headerColor = "#667eea") => {
  const logoUrl = "https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg";
  
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap');
        body {
          font-family: 'Heebo', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .logo {
          max-width: 120px;
          margin-bottom: 15px;
          border-radius: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${logoUrl}" alt="Nexora Logo" class="logo" />
          <h1>${title}</h1>
      </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexora. כל הזכויות שמורות.</p>
          <p>מייל זה נשלח אוטומטית, אנא אל תגיב עליו.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export function createCompanyRegistrationEmail(company, Name) {
  const content = `
    <p style="font-size: 18px; color: #333;"><strong>שלום,</strong></p>
    <p>אנו שמחים להודיע לך כי החברה שלך, <strong>${company}</strong>, נרשמה בהצלחה ב-Nexora.</p>
    <p style="font-size: 18px; color: #333;"><strong>שלום ${Name},</strong></p>
    <p>החברה שלך נמצאת כעת תחת ביקורת, ותקבל הודעה ברגע שתהליך האישור יושלם. אנו מעריכים את סבלנותך ונעבד את הבקשה שלך במהירות האפשרית.</p>
    <p>לאחר האישור, תקבל הוראות נוספות כיצד לנהל את חשבון החברה שלך.</p>
    <p>תודה שבחרת ב-Nexora. אם יש לך שאלות או זקוק לעזרה, אל תהסס ליצור קשר עם צוות התמיכה שלנו.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות Nexora</strong>
    </p>
  `;
  
  return getEmailTemplate("רישום חברה הושלם בהצלחה", content, "#667eea");
}

export function createCompanyApprovalEmail(companyName, profileUrl) {
  const content = `
    <p style="font-size: 18px; color: #333;"><strong>מזל טוב! 🎉</strong></p>
    <p>החברה שלך <strong>${companyName}</strong> אושרה בהצלחה! כעת תוכל להירשם כמנהל ולהתחיל לנהל את פעילות החברה שלך ב-Nexora.</p>
      <div style="text-align: center; margin: 30px 0;">
      <a href="${profileUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">הירשם כמנהל</a>
      </div>
    <p>לאחר ההרשמה, תהיה לך גישה לתכונות מתקדמות כגון ניהול עובדים, מעקב פרויקטים וניטור ביצועי החברה.</p>
    <p>אם יש לך שאלות, אל תהסס ליצור קשר עם צוות התמיכה שלנו.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות Nexora</strong>
    </p>
  `;
  
  return getEmailTemplate("החברה אושרה! ✅", content, "#4CAF50");
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
  const content = `
    <p style="font-size: 18px; color: #333;"><strong>שלום ${companyName},</strong></p>
    <p>רישום החברה שלך הושלם בהצלחה! כעת תוכל להתחבר ללוח הבקרה של החברה ולהתחיל לנהל את כל הכלים והתכונות שאנו מציעים.</p>
      <div style="text-align: center; margin: 30px 0;">
      <a href="${companyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">עבור ללוח הבקרה</a>
      </div>
    <p>אם יש לך שאלות או זקוק לעזרה, צוות התמיכה שלנו כאן בשבילך.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות Nexora</strong>
    </p>
  `;
  
  return getEmailTemplate("ברוכים הבאים ל-Nexora! 🎉", content, "#667eea");
}

export function createCombinedWelcomeInvoiceEmail(companyName, invoice) {
  const content = `
    <p style="font-size: 18px; color: #333;"><strong>ברוכים הבאים, ${companyName}!</strong></p>
    <p>תודה על התשלום שלך. להלן פרטי החשבונית שלך:</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>תוכנית:</strong> ${invoice.planName || 'N/A'}</p>
      <p style="margin: 8px 0;"><strong>סכום:</strong> ${invoice.amount || 0} ${invoice.currency || 'ILS'}</p>
      <p style="margin: 8px 0;"><strong>תאריך תשלום:</strong> ${new Date(invoice.paymentDate).toLocaleDateString('he-IL')}</p>
    </div>
    ${invoice.invoicePdfUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invoice.invoicePdfUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">הורד חשבונית</a>
    </div>
    ` : ''}
    <p>אנו מצפים לעבוד איתך!</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות Nexora</strong>
    </p>
  `;
  
  return getEmailTemplate("ברוכים הבאים & אישור תשלום", content, "#4CAF50");
}

export function createSubscriptionEndingEmail(company, name) {
  const content = `
    <div style="background-color: #FFF3CD; border-right: 4px solid #FFC107; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #856404;">
        ⚠️ תזכורת: המנוי שלך יפוג בעוד שבוע
      </p>
      </div>
    <p style="font-size: 18px; color: #333;"><strong>שלום ${name},</strong></p>
    <p>רצינו להזכיר לך שהמנוי שלך עבור <strong>${company}</strong> יפוג בעוד שבוע.</p>
    <p>כדי להבטיח גישה בלתי מופרעת לכל השירותים שלנו, אנו ממליצים לחדש את המנוי שלך בהקדם האפשרי.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.unlinked.com/renew-subscription" style="background: linear-gradient(135deg, #FF9800 0%, #FFC107 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">חדש מנוי עכשיו</a>
    </div>
    <p>אם יש לך שאלות או זקוק לעזרה, צוות התמיכה שלנו כאן בשבילך.</p>
    <p>תודה על היותך חלק יקר מקהילת Nexora.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות Nexora</strong>
    </p>
  `;
  
  return getEmailTemplate("המנוי שלך יפוג בקרוב", content, "#FF9800");
}

export function createPaymentFailedEmail(companyName, amount, invoiceUrl) {
  const content = `
    <div style="background-color: #FFEBEE; border-right: 4px solid #F44336; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #C62828;">
        ❌ לא הצלחנו לעבד את התשלום שלך
      </p>
    </div>
    <p style="font-size: 18px; color: #333;"><strong>שלום,</strong></p>
    <p>לא הצלחנו לעבד את התשלום עבור <strong>${companyName}</strong>.</p>
    <div style="background-color: #FFF3CD; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #FFC107;">
      <p style="margin: 5px 0;"><strong>סכום:</strong> $${amount.toFixed(2)}</p>
      <p style="margin: 5px 0;"><strong>סטטוס:</strong> תשלום נכשל</p>
    </div>
    <p>זה יכול להיות בגלל:</p>
    <ul style="line-height: 2;">
      <li>יתרה לא מספקת בחשבון שלך</li>
      <li>אמצעי תשלום שפג תוקפו</li>
      <li>כרטיס נדחה על ידי הבנק שלך</li>
      <li>צריך לעדכן את אמצעי התשלום</li>
        </ul>
    <p>אנא עדכן את אמצעי התשלום שלך כדי להמשיך להשתמש בשירותים שלנו ללא הפרעה.</p>
        <div style="text-align: center; margin: 30px 0;">
      <a href="${invoiceUrl || 'https://www.unlinked.com/update-payment'}" style="background: linear-gradient(135deg, #F44336 0%, #E91E63 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">עדכן אמצעי תשלום</a>
        </div>
    <p style="color: #666; font-size: 14px;">אם יש לך שאלות או זקוק לעזרה, אנא פנה לצוות התמיכה שלנו מיד.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות Nexora</strong>
    </p>
  `;
  
  return getEmailTemplate("תשלום נכשל", content, "#F44336");
}

export function createProcurementEmail(
  supplierName,
  companyName,
  purchaseOrderUrl
) {
  const content = `
    <p style="font-size: 18px; color: #333;"><strong>שלום ${supplierName},</strong></p>
    <p>אנו שמחים לשתף את הזמנת הרכש מ-<strong>${companyName}</strong>.</p>
    <p>תוכל להוריד את הזמנת הרכש באמצעות הקישור למטה:</p>
        <div style="text-align: center; margin: 30px 0;">
      <a href="${purchaseOrderUrl}" style="background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">הורד הזמנת רכש</a>
        </div>
    <p>אם יש לך שאלות או זקוק לעזרה נוספת, אנא אל תהסס ליצור איתנו קשר.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות ${companyName}</strong>
    </p>
  `;
  
  return getEmailTemplate("הזמנת רכש חדשה", content, "#4CAF50");
}
export function createProcurementUpdateEmail(
  supplierName,
  companyName,
  procurementOrderId
) {
  const updateUrl = `http://localhost:5173/supplier/updateProcurement/${procurementOrderId}`;

  const content = `
    <p style="font-size: 18px; color: #333;"><strong>שלום ${supplierName},</strong></p>
    <p>אנו רוצים להודיע לך כי הייתה עדכון להזמנת הרכש מ-<strong>${companyName}</strong>.</p>
    <p>תוכל לצפות ולעדכן את פרטי הרכש באמצעות הקישור למטה:</p>
        <div style="text-align: center; margin: 30px 0;">
      <a href="${updateUrl}" style="background: linear-gradient(135deg, #FF9800 0%, #FFC107 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">צפה ועדכן הזמנת רכש</a>
        </div>
    <p>אם יש לך שאלות או זקוק לעזרה נוספת, אנא אל תהסס ליצור איתנו קשר.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות ${companyName}</strong>
    </p>
  `;
  
  return getEmailTemplate("עדכון הזמנת רכש", content, "#FF9800");
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
    <tr style="border-bottom: 1px solid #dee2e6;">
      <td style="padding: 12px; text-align: right;">${product.productName}</td>
      <td style="padding: 12px; text-align: center;">${product.orderedQuantity}</td>
      <td style="padding: 12px; text-align: center; color: #F44336; font-weight: bold;">${product.receivedQuantity}</td>
    </tr>
  `
    )
    .join("");

  const content = `
    <p style="font-size: 18px; color: #333;"><strong>שלום ${supplierName},</strong></p>
    <div style="background-color: #FFF3CD; border-right: 4px solid #FFC107; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #856404;">
        ⚠️ אי-התאמה בהזמנת רכש
      </p>
        </div>
    <p>אנו רוצים להודיע לך כי הכמות שהתקבלה עבור הזמנת רכש <strong>${orderNumber}</strong> מ-<strong>${companyName}</strong> נמוכה מהכמות שהוזמנה.</p>
    <p style="margin-top: 20px;"><strong>פרטי האי-התאמות:</strong></p>
    <div style="overflow-x: auto; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px;">
            <thead>
          <tr style="background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%); color: white;">
            <th style="padding: 12px; text-align: right; font-weight: bold;">שם מוצר</th>
            <th style="padding: 12px; text-align: center; font-weight: bold;">כמות שהוזמנה</th>
            <th style="padding: 12px; text-align: center; font-weight: bold;">כמות שהתקבלה</th>
              </tr>
            </thead>
            <tbody>
              ${discrepancyRows}
            </tbody>
          </table>
        </div>
    <p>אם יש לך שאלות או זקוק לעזרה נוספת, אנא אל תהסס ליצור איתנו קשר.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות ${companyName}</strong>
    </p>
  `;
  
  return getEmailTemplate("אי-התאמה בהזמנת רכש", content, "#FF9800");
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
  const content = `
    <p style="font-size: 18px; color: #333;"><strong>שלום ${supplierName},</strong></p>
    <p>אנו שמחים לשתף את פרטי החשבונית מ-<strong>${companyName}</strong>.</p>
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 8px 0;"><strong>מספר חשבונית:</strong> ${invoiceNumber}</p>
      <p style="margin: 8px 0;"><strong>תאריך חשבונית:</strong> ${new Date(invoiceDate).toLocaleDateString('he-IL')}</p>
      <p style="margin: 8px 0;"><strong>תאריך תפוגה:</strong> ${new Date(dueDate).toLocaleDateString('he-IL')}</p>
      <p style="margin: 8px 0;"><strong>סכום כולל:</strong> ${totalAmount.toLocaleString()} ${currency}</p>
    </div>
    ${invoiceUrl ? `
    <p>תוכל לצפות בפרטי החשבונית המלאים באמצעות הקישור למטה:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${invoiceUrl}" style="background: linear-gradient(135deg, #2196F3 0%, #03A9F4 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">צפה בחשבונית</a>
    </div>
    ` : ''}
    <p>אם יש לך שאלות או זקוק לעזרה נוספת, אנא אל תהסס ליצור איתנו קשר.</p>
    <p style="margin-top: 30px; color: #666;">
      בברכה,<br>
      <strong>צוות ${companyName}</strong>
    </p>
  `;
  
  return getEmailTemplate("חשבונית ספק", content, "#2196F3");
}

/**
 * ברכת יום הולדת מעוצבת
 */
export function createBirthdayEmail(employeeName, companyName, profileImageUrl = null) {
  const logoUrl = "https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg";
  
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>יום הולדת שמח!</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap');
        body {
          font-family: 'Heebo', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .header {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '🎉';
          font-size: 80px;
          position: absolute;
          top: -20px;
          right: -20px;
          opacity: 0.3;
        }
        .header::after {
          content: '🎂';
          font-size: 80px;
          position: absolute;
          bottom: -20px;
          left: -20px;
          opacity: 0.3;
        }
        .logo {
          max-width: 120px;
          margin-bottom: 15px;
          border-radius: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .profile-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 5px solid #FF6B6B;
          margin: 20px auto;
          object-fit: cover;
          box-shadow: 0 5px 15px rgba(255,107,107,0.3);
        }
        .birthday-message {
          font-size: 24px;
          color: #333;
          margin: 20px 0;
          font-weight: bold;
        }
        .wish-text {
          font-size: 18px;
          color: #666;
          margin: 20px 0;
          line-height: 1.8;
        }
        .confetti {
          font-size: 40px;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${logoUrl}" alt="Nexora Logo" class="logo" />
          <h1>יום הולדת שמח! 🎉</h1>
      </div>
        <div class="content">
          ${profileImageUrl ? `<img src="${profileImageUrl}" alt="${employeeName}" class="profile-image" />` : ''}
          <div class="birthday-message">
            ${employeeName} היקר/ה,
        </div>
          <div class="confetti">🎂 🎈 🎁 🎊 🎉</div>
          <div class="wish-text">
            <p>אנו ב-<strong>${companyName}</strong> מאחלים לך יום הולדת שמח ומבורך!</p>
            <p>אנו מעריכים את התרומה שלך לצוות ומאחלים לך שנה נפלאה מלאה בהצלחות, בריאות ואושר.</p>
            <p>מקווים שתחגוג את היום המיוחד הזה עם האנשים היקרים לך ביותר! 🎈</p>
          </div>
          <div class="confetti">🎉 🎊 🎁 🎈 🎂</div>
          <p style="margin-top: 30px; color: #666;">
            בברכה,<br>
            <strong>צוות ${companyName}</strong>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexora. כל הזכויות שמורות.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * סיכום תזרים מזומנים חודשי
 */
export function createMonthlyCashFlowSummary(companyName, month, year, cashFlowData, baseCurrency = "ILS") {
  const logoUrl = "https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg";
  const { totalIncome, totalExpense, netCashFlow, previousMonthFlow, trend } = cashFlowData;
  
  const trendIcon = trend > 0 ? "📈" : trend < 0 ? "📉" : "➡️";
  const trendColor = trend > 0 ? "#4CAF50" : trend < 0 ? "#F44336" : "#FF9800";
  
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>סיכום תזרים מזומנים חודשי</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap');
        body {
          font-family: 'Heebo', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .logo {
          max-width: 120px;
          margin-bottom: 15px;
          border-radius: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .summary-box {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
          border-right: 4px solid #667eea;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .summary-row:last-child {
          border-bottom: none;
        }
        .summary-label {
          font-weight: bold;
          color: #666;
          font-size: 16px;
        }
        .summary-value {
          color: #333;
          font-size: 18px;
          font-weight: bold;
        }
        .income { color: #4CAF50; }
        .expense { color: #F44336; }
        .net-flow {
          font-size: 24px;
          color: ${netCashFlow >= 0 ? '#4CAF50' : '#F44336'};
          font-weight: bold;
        }
        .trend-indicator {
          text-align: center;
          padding: 15px;
          background-color: ${trendColor}15;
          border-radius: 8px;
          margin: 20px 0;
        }
        .trend-text {
          font-size: 18px;
          color: ${trendColor};
          font-weight: bold;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${logoUrl}" alt="Nexora Logo" class="logo" />
          <h1>סיכום תזרים מזומנים חודשי</h1>
        </div>
        <div class="content">
          <p style="font-size: 18px; color: #333;"><strong>שלום ${companyName},</strong></p>
          <p>להלן סיכום תזרים המזומנים שלך לחודש ${month}/${year}:</p>
          
          <div class="summary-box">
            <div class="summary-row">
              <span class="summary-label">הכנסות כוללות:</span>
              <span class="summary-value income">${totalIncome.toLocaleString()} ${baseCurrency}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">הוצאות כוללות:</span>
              <span class="summary-value expense">${totalExpense.toLocaleString()} ${baseCurrency}</span>
            </div>
            <div class="summary-row" style="border-top: 2px solid #667eea; margin-top: 10px; padding-top: 15px;">
              <span class="summary-label">תזרים מזומנים נטו:</span>
              <span class="summary-value net-flow">${netCashFlow.toLocaleString()} ${baseCurrency}</span>
            </div>
          </div>
          
          ${previousMonthFlow !== undefined ? `
          <div class="trend-indicator">
            <div style="font-size: 32px; margin-bottom: 10px;">${trendIcon}</div>
            <div class="trend-text">
              ${trend > 0 ? 'עלייה' : trend < 0 ? 'ירידה' : 'ללא שינוי'} לעומת החודש הקודם
            </div>
            <div style="color: #666; margin-top: 5px;">
              ${Math.abs(trend).toLocaleString()} ${baseCurrency}
            </div>
        </div>
        ` : ''}
          
          <p style="margin-top: 30px; color: #666;">
            לפרטים נוספים, אנא היכנס למערכת וצפה בדוחות המפורטים.
          </p>
          
          <p style="color: #666;">
            בברכה,<br>
            <strong>צוות Nexora</strong>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexora. כל הזכויות שמורות.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * הודעה על ביטול הזמנה לספק
 */
export function createProcurementCancellationEmail(supplierName, companyName, orderNumber, orderDate, cancellationReason = null) {
  const logoUrl = "https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg";
  
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ביטול הזמנת רכש</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap');
        body {
          font-family: 'Heebo', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #F44336 0%, #E91E63 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .logo {
          max-width: 120px;
          margin-bottom: 15px;
          border-radius: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .alert-box {
          background-color: #FFF3CD;
          border-right: 4px solid #FFC107;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .order-details {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #666;
        }
        .detail-value {
          color: #333;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${logoUrl}" alt="Nexora Logo" class="logo" />
          <h1>ביטול הזמנת רכש</h1>
        </div>
        <div class="content">
          <p style="font-size: 18px; color: #333;"><strong>שלום ${supplierName},</strong></p>
          
          <div class="alert-box">
            <p style="margin: 0; font-weight: bold; color: #856404;">
              ⚠️ אנו מודיעים לך כי הזמנת הרכש הבאה בוטלה:
            </p>
          </div>
          
          <div class="order-details">
            <div class="detail-row">
              <span class="detail-label">מספר הזמנה:</span>
              <span class="detail-value"><strong>${orderNumber}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">תאריך הזמנה:</span>
              <span class="detail-value">${new Date(orderDate).toLocaleDateString('he-IL')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">חברה:</span>
              <span class="detail-value">${companyName}</span>
            </div>
          </div>
          
          ${cancellationReason ? `
          <p style="margin-top: 20px;"><strong>סיבת הביטול:</strong></p>
          <p style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; color: #666;">
            ${cancellationReason}
          </p>
          ` : ''}
          
          <p style="margin-top: 30px; color: #666;">
            אנו מצטערים על אי הנוחות. אם יש לך שאלות או דאגות, אנא אל תהסס ליצור איתנו קשר.
          </p>
          
          <p style="color: #666;">
            בברכה,<br>
            <strong>צוות ${companyName}</strong>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexora. כל הזכויות שמורות.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * סיכום שבועי - מכירות, פרויקטים, הזמנות
 */
export function createWeeklySummaryEmail(companyName, weekStart, weekEnd, summaryData) {
  const logoUrl = "https://img.freepik.com/premium-vector/linkedin-logo_578229-227.jpg";
  const { sales, projects, orders } = summaryData;
  
  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>סיכום שבועי</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap');
        body {
          font-family: 'Heebo', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px;
          text-align: center;
          color: white;
        }
        .logo {
          max-width: 120px;
          margin-bottom: 15px;
          border-radius: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .content {
          padding: 30px;
        }
        .section {
          margin: 25px 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .section-header {
          padding: 15px 20px;
          font-weight: bold;
          font-size: 18px;
          color: white;
        }
        .sales-header { background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%); }
        .projects-header { background: linear-gradient(135deg, #2196F3 0%, #03A9F4 100%); }
        .orders-header { background: linear-gradient(135deg, #FF9800 0%, #FFC107 100%); }
        .section-content {
          padding: 20px;
          background-color: #f8f9fa;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .stat-row:last-child {
          border-bottom: none;
        }
        .stat-label {
          color: #666;
        }
        .stat-value {
          font-weight: bold;
          color: #333;
          font-size: 18px;
        }
        .highlight {
          background-color: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-right: 4px solid #ffc107;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${logoUrl}" alt="Nexora Logo" class="logo" />
          <h1>סיכום שבועי</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            ${new Date(weekStart).toLocaleDateString('he-IL')} - ${new Date(weekEnd).toLocaleDateString('he-IL')}
          </p>
        </div>
        <div class="content">
          <p style="font-size: 18px; color: #333;"><strong>שלום ${companyName},</strong></p>
          <p>להלן סיכום הפעילות השבועית שלך:</p>
          
          ${sales ? `
          <div class="section">
            <div class="section-header sales-header">💰 מכירות</div>
            <div class="section-content">
              <div class="stat-row">
                <span class="stat-label">סה"כ מכירות:</span>
                <span class="stat-value">${sales.totalSales?.toLocaleString() || 0} ${sales.currency || 'ILS'}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">מספר הזמנות:</span>
                <span class="stat-value">${sales.totalOrders || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">ממוצע להזמנה:</span>
                <span class="stat-value">${sales.averageOrderValue ? sales.averageOrderValue.toLocaleString() : 0} ${sales.currency || 'ILS'}</span>
              </div>
              ${sales.growth ? `
              <div class="highlight">
                <strong>צמיחה:</strong> ${sales.growth > 0 ? '+' : ''}${sales.growth.toFixed(1)}% לעומת השבוע הקודם
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
          
          ${projects ? `
          <div class="section">
            <div class="section-header projects-header">📊 פרויקטים</div>
            <div class="section-content">
              <div class="stat-row">
                <span class="stat-label">פרויקטים פעילים:</span>
                <span class="stat-value">${projects.activeProjects || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">פרויקטים הושלמו:</span>
                <span class="stat-value">${projects.completedProjects || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">פרויקטים חדשים:</span>
                <span class="stat-value">${projects.newProjects || 0}</span>
              </div>
              ${projects.overdueProjects > 0 ? `
              <div class="highlight" style="border-right-color: #F44336;">
                <strong>⚠️ אזהרה:</strong> ${projects.overdueProjects} פרויקטים איחרו
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
          
          ${orders ? `
          <div class="section">
            <div class="section-header orders-header">📦 הזמנות</div>
            <div class="section-content">
              <div class="stat-row">
                <span class="stat-label">הזמנות חדשות:</span>
                <span class="stat-value">${orders.newOrders || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">הזמנות בתהליך:</span>
                <span class="stat-value">${orders.inProgress || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">הזמנות הושלמו:</span>
                <span class="stat-value">${orders.completed || 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">סה"כ ערך הזמנות:</span>
                <span class="stat-value">${orders.totalValue?.toLocaleString() || 0} ${orders.currency || 'ILS'}</span>
              </div>
            </div>
          </div>
          ` : ''}
          
          <p style="margin-top: 30px; color: #666;">
            לפרטים נוספים, אנא היכנס למערכת וצפה בדוחות המפורטים.
          </p>
          
          <p style="color: #666;">
            בברכה,<br>
            <strong>צוות Nexora</strong>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexora. כל הזכויות שמורות.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
