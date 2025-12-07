# 🚀 Nexora ERP - Enterprise Resource Planning System

<div align="center">

![Nexora Logo](https://img.shields.io/badge/Nexora-ERP-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-ISC-orange?style=for-the-badge)

**מערכת ERP מלאה ומקיפה לניהול עסקי מתקדם**

[English](#english) | [עברית](#עברית) | [العربية](#العربية) | [Русский](#русский)

</div>

---

## 📋 תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [תכונות עיקריות](#תכונות-עיקריות)
- [טכנולוגיות](#טכנולוגיות)
- [התקנה והפעלה](#התקנה-והפעלה)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [מודולים](#מודולים)
- [API Documentation](#api-documentation)
- [תרומה לפרויקט](#תרומה-לפרויקט)
- [רישיון](#רישיון)

---

## 🎯 סקירה כללית

**Nexora ERP** היא מערכת ERP (Enterprise Resource Planning) מקיפה ומתקדמת המספקת פתרון מלא לניהול עסקי. המערכת כוללת מודולים רבים לניהול עובדים, רכש, מלאי, לקוחות, פרויקטים, כספים ועוד.

### ✨ תכונות מרכזיות

- 🌍 **תמיכה ב-7 שפות**: עברית, אנגלית, רוסית, יפנית, צרפתית, ספרדית, ערבית
- 🔐 **אבטחה מתקדמת**: JWT Authentication, RBAC, Permission System
- 📊 **דוחות ואנליטיקה**: דוחות מפורטים, תובנות AI, חיזויים
- 💰 **ניהול תשלומים**: אינטגרציה עם Stripe, תוכניות מנוי
- 📄 **יצירת PDF**: תמיכה מלאה בשפות כולל RTL
- 🔔 **התראות**: מערכת התראות מתקדמת
- 📱 **Responsive Design**: עיצוב מותאם לכל המכשירים

---

## 🛠️ טכנולוגיות

### Backend

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB עם Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Payment**: Stripe
- **Caching**: Redis (ioredis)
- **Scheduling**: node-cron, node-schedule
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: Joi, express-validator

### Frontend

- **Framework**: React 18.3
- **Build Tool**: Vite
- **State Management**: Zustand, TanStack Query
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS, DaisyUI
- **Animations**: Framer Motion
- **Forms**: Formik, React Hook Form, Yup
- **Charts**: Chart.js, react-chartjs-2
- **PDF**: html2pdf.js, jsPDF, html2canvas
- **i18n**: react-i18next (7 שפות)
- **Icons**: Lucide React, Heroicons, React Icons

---

## 📦 התקנה והפעלה

### דרישות מוקדמות

- Node.js (v18 או גבוה יותר)
- MongoDB (v5 או גבוה יותר)
- Redis (אופציונלי, לשיפור ביצועים)
- npm או yarn

### התקנה

1. **שכפול הפרויקט**
```bash
git clone https://github.com/yourusername/nexora-erp.git
cd nexora-erp
```

2. **התקנת תלויות Backend**
```bash
npm install
```

3. **התקנת תלויות Frontend**
```bash
cd frontend
npm install
cd ..
```

4. **הגדרת משתני סביבה**

צור קובץ `.env` בתיקיית ה-root:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/nexora

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5000
NODE_ENV=development
```

5. **הפעלת השרתים**

**Backend:**
```bash
npm run dev
```

**Frontend (בטרמינל נפרד):**
```bash
cd frontend
npm run dev
```

השרתים יפעלו על:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## 📁 מבנה הפרויקט

```
nexora-erp/
├── backend/
│   ├── Ai/                    # AI features
│   ├── config/               # Configuration files
│   │   ├── db.js            # Database connection
│   │   ├── redis.js         # Redis configuration
│   │   ├── addIndexes.js    # Performance indexes
│   │   └── lib/             # Libraries (Cloudinary, Nodemailer, Payment)
│   ├── controllers/         # 73 controller files
│   ├── models/              # 73 model files
│   ├── routes/              # 56 route files
│   ├── middleware/          # Custom middleware
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── emails/              # Email templates
│   ├── CronJob.js           # Scheduled tasks
│   └── server.js            # Main server file
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # 179 page files
│   │   │   ├── AdminPanel/ # Admin pages
│   │   │   ├── auth/        # Authentication pages
│   │   │   └── employeePages/ # Employee pages
│   │   ├── components/      # Reusable components
│   │   ├── stores/          # Zustand stores
│   │   ├── hooks/           # Custom hooks
│   │   ├── api/             # API configuration
│   │   └── lib/             # Libraries
│   ├── public/              # Static assets
│   └── package.json
│
└── package.json
```

---

## 🎨 מודולים

### 1. ניהול עובדים (HR) 👥

- **ניהול עובדים**: רשימת עובדים, פרטי עובדים, היסטוריה
- **נוכחות**: מעקב נוכחות, דוחות נוכחות
- **משמרות**: ניהול משמרות, משמרות אישיות, אחוזי עבודה
- **חופשות ומחלות**: ניהול ימי חופשה, ימי מחלה, איזונים
- **ביקורות ביצועים**: הערכות ביצועים, מעקב אחרי יעדים
- **שכר ומשכורות**: חישוב שכר, תצורת מס, תעריפי שכר, אוטומציה
- **ATS**: מערכת גיוס עובדים
- **LMS**: מערכת למידה וניהול קורסים
- **דוחות HR**: אנליטיקה מתקדמת של HR

### 2. רכש (Procurement) 🛒

- **הזמנות רכש**: יצירה, עריכה, מעקב אחרי הזמנות
- **הצעות מחיר**: ניהול הצעות מחיר מספקים
- **רשימות מחירים**: ניהול רשימות מחירים מתקדמות
  - הנחות לפי כמות (Quantity Breaks)
  - תמחור תקופתי (Period Pricing)
  - תמיכה בלקוחות וספקים ספציפיים
- **בקשות רכש**: ניהול בקשות רכש פנימיות
- **חוזי ספקים**: ניהול חוזים עם ספקים
- **חשבוניות ספקים**: מעקב אחרי חשבוניות
- **לוחות זמנים לאספקה**: תכנון אספקה
- **מכרזים**: ניהול מכרזים
- **מעקב רכש**: מעקב אחרי סטטוס הזמנות

### 3. ניהול מלאי (Inventory) 📦

- **ניהול מוצרים**: רשימת מוצרים, הוספת מוצרים, עריכת מוצרים
- **ניהול מחסנים**: יצירת מחסנים, מיקומים במחסן
- **העברות בין מחסנים**: העברת מוצרים בין מחסנים
- **תנועות מלאי**: מעקב אחרי תנועות מלאי
- **ספירות מלאי**: ביצוע ספירות, השוואות
- **בדיקות איכות**: ניהול בדיקות איכות
- **היסטוריית מלאי**: מעקב אחרי היסטוריית מלאי
- **ניצול מחסנים**: חישוב ניצול מחסנים

### 4. ניהול לקוחות (CRM) 👤

- **ניהול לקוחות**: רשימת לקוחות, פרטי לקוחות
- **הזמנות לקוחות**: יצירת הזמנות, מעקב הזמנות
- **הצעות מחיר**: יצירת הצעות מחיר מותאמות
- **Customer 360**: תצוגה כוללת של לקוח
- **סגמנטציה**: חלוקת לקוחות לסגמנטים
- **שביעות רצון**: מעקב אחרי שביעות רצון לקוחות
- **שימור לקוחות**: ניתוח שימור לקוחות
- **שירות לקוחות**: ניהול כרטיסי תמיכה
- **לידים**: ניהול לידים, פעילויות, אנליטיקה

### 5. ניהול פרויקטים 📊

- **ניהול פרויקטים**: יצירת פרויקטים, מעקב פרויקטים
- **Gantt Charts**: תרשימי גאנט
- **Timeline**: ציר זמן של פרויקטים
- **הקצאת משאבים**: ניהול הקצאת משאבים
- **תיק פרויקטים**: ניהול תיק פרויקטים
- **תבניות פרויקטים**: יצירת תבניות פרויקטים
- **ניהול סיכונים**: זיהוי וניהול סיכונים
- **תכנון קיבולת**: תכנון קיבולת משאבים

### 6. כספים (Finance) 💰

- **רשומות כספיות**: ניהול רשומות כספיות
- **תזרים מזומנים**: מעקב אחרי תזרים מזומנים
- **תקציבים**: ניהול תקציבים, מעקב אחרי תקציבים
- **חשבונאות**: יומן כללי, ספר ראשי, חשבונות
- **חשבונות בנק**: ניהול חשבונות בנק
- **תנועות בנק**: מעקב אחרי תנועות בנק
- **חשבוניות**: יצירת חשבוניות, מעקב אחרי חשבוניות

### 7. ניהול משימות ✅

- **יצירת משימות**: יצירת משימות חדשות
- **רשימת משימות**: רשימת כל המשימות
- **מעקב אחרי משימות**: מעקב אחרי סטטוס משימות
- **הקצאת משימות**: הקצאת משימות לעובדים

### 8. ניהול מוצרים 🏷️

- **רשימת מוצרים**: רשימת כל המוצרים
- **הוספת מוצרים**: יצירת מוצרים חדשים
- **עץ מוצרים**: ניהול עץ מוצרים (Product Tree)
- **הזמנות ייצור**: ניהול הזמנות ייצור

### 9. ניהול ספקים 🤝

- **רשימת ספקים**: רשימת כל הספקים
- **הוספת ספקים**: יצירת ספקים חדשים
- **חוזי ספקים**: ניהול חוזים עם ספקים
- **חשבוניות ספקים**: מעקב אחרי חשבוניות

### 10. ניהול לידים 📈

- **ניהול לידים**: יצירת לידים, מעקב לידים
- **פעילויות**: מעקב אחרי פעילויות לידים
- **אנליטיקה**: דוחות ואנליטיקה של לידים

### 11. ניהול נכסים (Assets) 🏢

- **רשימת נכסים**: רשימת כל הנכסים
- **הוספת נכסים**: יצירת נכסים חדשים
- **פרטי נכסים**: צפייה בפרטי נכסים

### 12. ניהול משמרות ⏰

- **רשימת משמרות**: רשימת כל המשמרות
- **משמרות אישיות**: משמרות של עובד ספציפי
- **אחוזי עבודה**: חישוב אחוזי עבודה

### 13. ניהול חוזים 📄

- **רשימת חוזים**: רשימת כל החוזים
- **הוספת חוזים**: יצירת חוזים חדשים

### 14. ניהול אירועים 📅

- **לוח אירועים**: לוח אירועים כולל
- **יצירת אירועים**: יצירת אירועים חדשים

### 15. ניהול מחלקות 🏛️

- **רשימת מחלקות**: רשימת כל המחלקות
- **הוספת מחלקות**: יצירת מחלקות חדשות

### 16. ניהול תפקידים והרשאות 🔐

- **ניהול תפקידים**: יצירת תפקידים, עריכת תפקידים
- **ניהול הרשאות**: ניהול הרשאות מפורט
- **בקרת גישה**: RBAC (Role-Based Access Control)

### 17. מערכת תמיכה 🎫

- **כרטיסי תמיכה**: יצירת כרטיסים, מעקב כרטיסים
- **ניהול תמיכה**: ניהול מלא של מערכת התמיכה

### 18. מעקב משלוחים 🚚

- **מעקב משלוחים**: מעקב אחרי משלוחים
- **פרטי משלוח**: צפייה בפרטי משלוח
- **ניהול הזמנות**: ניהול הזמנות משלוח

### 19. אנליטיקה ודוחות 📊

- **דוחות כספיים**: דוחות כספיים מפורטים
- **אנליטיקה של HR**: דוחות ואנליטיקה של HR
- **אנליטיקה של לידים**: דוחות ואנליטיקה של לידים
- **דוחות מתקדמים**: דוחות מותאמים אישית

### 20. AI 🤖

- **חיזויים**: חיזוי מכירות, תחזיות
- **ניתוח רווחיות**: ניתוח רווחיות מתקדם
- **מגמות מכירות**: זיהוי מגמות מכירות
- **תובנות אוטומטיות**: תובנות AI אוטומטיות

---

## 🔐 אבטחה

- **JWT Authentication**: אימות מבוסס JWT
- **Role-Based Access Control (RBAC)**: בקרת גישה מבוססת תפקידים
- **Permission System**: מערכת הרשאות מפורטת
- **Rate Limiting**: הגבלת קצב בקשות
- **Helmet Security**: אבטחת HTTP headers
- **CORS Configuration**: הגדרת CORS
- **Input Validation**: אימות קלט
- **Error Handling**: טיפול בשגיאות

---

## 🌍 בינלאומיות (i18n)

המערכת תומכת ב-7 שפות:

- 🇮🇱 **עברית** (Hebrew)
- 🇬🇧 **אנגלית** (English)
- 🇷🇺 **רוסית** (Russian)
- 🇯🇵 **יפנית** (Japanese)
- 🇫🇷 **צרפתית** (French)
- 🇪🇸 **ספרדית** (Spanish)
- 🇸🇦 **ערבית** (Arabic)

**תכונות:**
- תמיכה מלאה ב-RTL (מימין לשמאל)
- תאריכים וזמנים מותאמים לשפה
- PDF עם תמיכה בשפות
- ממשק משתמש מתורגם מלא

---

## 💳 תשלומים

המערכת כוללת אינטגרציה מלאה עם **Stripe**:

- **תוכניות מנוי**: Basic, Pro, Enterprise
- **תשלומים חוזרים**: תמיכה בתשלומים חוזרים
- **Webhooks**: טיפול ב-webhooks של Stripe
- **ניהול מנויים**: ניהול מלא של מנויים

---

## 📄 יצירת PDF

המערכת תומכת ביצירת PDF עם:

- תמיכה מלאה בשפות כולל RTL
- עיצוב מותאם ופורמלי
- תמיכה בעברית, ערבית ושפות אחרות
- יצירת PDF מהזמנות, חשבוניות, רכש ועוד

---

## 📊 סטטיסטיקות

- **Models**: 73 מודלים
- **Controllers**: 73 controllers
- **Routes**: 56 routes
- **Pages**: 179 דפים
- **Components**: 44 components
- **Languages**: 7 שפות
- **API Endpoints**: 200+ endpoints

---

## 🚀 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
רוב ה-endpoints דורשים אימות. שלח את ה-JWT token ב-header:
```
Authorization: Bearer <token>
```

### Endpoints עיקריים

#### Authentication
- `POST /api/auth/register` - הרשמה
- `POST /api/auth/login` - התחברות
- `POST /api/auth/logout` - התנתקות
- `POST /api/auth/forgot-password` - שכחת סיסמה
- `POST /api/auth/reset-password` - איפוס סיסמה

#### Employees
- `GET /api/employees` - רשימת עובדים
- `POST /api/employees` - יצירת עובד
- `GET /api/employees/:id` - פרטי עובד
- `PUT /api/employees/:id` - עדכון עובד
- `DELETE /api/employees/:id` - מחיקת עובד

#### Procurement
- `GET /api/procurement` - רשימת רכש
- `POST /api/procurement` - יצירת רכש
- `GET /api/procurement/:id` - פרטי רכש
- `PUT /api/procurement/:id` - עדכון רכש
- `DELETE /api/procurement/:id` - מחיקת רכש

#### Inventory
- `GET /api/inventory` - רשימת מלאי
- `POST /api/inventory` - יצירת מלאי
- `GET /api/inventory/:id` - פרטי מלאי
- `PUT /api/inventory/:id` - עדכון מלאי

#### Customers
- `GET /api/customers` - רשימת לקוחות
- `POST /api/customers` - יצירת לקוח
- `GET /api/customers/:id` - פרטי לקוח
- `PUT /api/customers/:id` - עדכון לקוח

#### Products
- `GET /api/products` - רשימת מוצרים
- `POST /api/products` - יצירת מוצר
- `GET /api/products/:id` - פרטי מוצר
- `PUT /api/products/:id` - עדכון מוצר

#### Finance
- `GET /api/finance` - רשימת כספים
- `POST /api/finance` - יצירת רשומה כספית
- `GET /api/finance/cash-flow` - תזרים מזומנים

#### Projects
- `GET /api/projects` - רשימת פרויקטים
- `POST /api/projects` - יצירת פרויקט
- `GET /api/projects/:id` - פרטי פרויקט

#### Tasks
- `GET /api/tasks` - רשימת משימות
- `POST /api/tasks` - יצירת משימה
- `GET /api/tasks/:id` - פרטי משימה

---

## 🧪 בדיקות

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 📝 תרומה לפרויקט

תרומות מתקבלות בברכה! אנא:

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/AmazingFeature`)
3. Commit את השינויים (`git commit -m 'Add some AmazingFeature'`)
4. Push ל-branch (`git push origin feature/AmazingFeature`)
5. פתח Pull Request

---

## 📄 רישיון

פרויקט זה מוגן תחת רישיון ISC.

---

## 👥 מחברים

- **Shay Elisha** - מפתח ראשי

---

## 🙏 תודות

תודה לכל התורמים והמשתמשים של Nexora ERP!

---

## 📞 יצירת קשר

לשאלות ותמיכה:
- **Email**: support@nexora.com
- **Website**: https://nexora.com
- **Documentation**: https://docs.nexora.com

---

## 🔄 עדכונים אחרונים

### v1.0.0 (2025-01-XX)
- ✨ הוספת תמיכה ב-7 שפות
- ✨ שיפור מערכת רשימות מחירים
- ✨ הוספת הנחות לפי כמות
- ✨ שיפור יצירת PDF עם תמיכה ב-RTL
- 🐛 תיקון באגים שונים
- ⚡ שיפורי ביצועים

---

<div align="center">

**נבנה עם ❤️ על ידי צוות Nexora**

⭐ אם הפרויקט עזר לך, אנא תן לנו ⭐

</div>

---

## English

### Overview

**Nexora ERP** is a comprehensive Enterprise Resource Planning (ERP) system that provides a complete solution for business management. The system includes many modules for managing employees, procurement, inventory, customers, projects, finances, and more.

### Key Features

- 🌍 **7 Language Support**: Hebrew, English, Russian, Japanese, French, Spanish, Arabic
- 🔐 **Advanced Security**: JWT Authentication, RBAC, Permission System
- 📊 **Reports & Analytics**: Detailed reports, AI insights, predictions
- 💰 **Payment Management**: Stripe integration, subscription plans
- 📄 **PDF Generation**: Full language support including RTL
- 🔔 **Notifications**: Advanced notification system
- 📱 **Responsive Design**: Design adapted for all devices

### Technologies

**Backend**: Node.js, Express.js, MongoDB, JWT, Stripe, Cloudinary, Redis
**Frontend**: React, Vite, TanStack Query, Zustand, Tailwind CSS, Framer Motion

---

## العربية

### نظرة عامة

**Nexora ERP** هو نظام تخطيط موارد المؤسسات (ERP) شامل يوفر حلاً كاملاً لإدارة الأعمال. يتضمن النظام العديد من الوحدات لإدارة الموظفين والمشتريات والمخزون والعملاء والمشاريع والمالية والمزيد.

### الميزات الرئيسية

- 🌍 **دعم 7 لغات**: العبرية، الإنجليزية، الروسية، اليابانية، الفرنسية، الإسبانية، العربية
- 🔐 **أمان متقدم**: مصادقة JWT، RBAC، نظام الصلاحيات
- 📊 **التقارير والتحليلات**: تقارير مفصلة، رؤى AI، توقعات
- 💰 **إدارة المدفوعات**: تكامل Stripe، خطط الاشتراك
- 📄 **إنشاء PDF**: دعم كامل للغات بما في ذلك RTL
- 🔔 **الإشعارات**: نظام إشعارات متقدم
- 📱 **تصميم متجاوب**: تصميم متكيف لجميع الأجهزة

---

## Русский

### Обзор

**Nexora ERP** — это комплексная система планирования ресурсов предприятия (ERP), которая предоставляет полное решение для управления бизнесом. Система включает множество модулей для управления сотрудниками, закупками, запасами, клиентами, проектами, финансами и многого другого.

### Основные функции

- 🌍 **Поддержка 7 языков**: иврит, английский, русский, японский, французский, испанский, арабский
- 🔐 **Продвинутая безопасность**: аутентификация JWT, RBAC, система разрешений
- 📊 **Отчеты и аналитика**: подробные отчеты, AI-инсайты, прогнозы
- 💰 **Управление платежами**: интеграция Stripe, планы подписки
- 📄 **Генерация PDF**: полная поддержка языков, включая RTL
- 🔔 **Уведомления**: продвинутая система уведомлений
- 📱 **Адаптивный дизайн**: дизайн, адаптированный для всех устройств

