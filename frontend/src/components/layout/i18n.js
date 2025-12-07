// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import all translation modules dynamically
import commonTranslations from "./translations/modules/common.json";
import authTranslations from "./translations/modules/auth.json";
import layoutTranslations from "./translations/modules/layout.json";
import productsTranslations from "./translations/modules/products.json";
import employeesTranslations from "./translations/modules/employees.json";
import financeTranslations from "./translations/modules/finance.json";
import procurementTranslations from "./translations/modules/procurement.json";
import customersTranslations from "./translations/modules/customers.json";
import departmentsTranslations from "./translations/modules/departments.json";
import signaturesTranslations from "./translations/modules/signatures.json";
import reportsTranslations from "./translations/modules/reports.json";
import notificationsTranslations from "./translations/modules/notifications.json";
import performanceTranslations from "./translations/modules/performance.json";
import settingsTranslations from "./translations/modules/settings.json";
import warehouseTranslations from "./translations/modules/warehouse.json";
import supportTranslations from "./translations/modules/support.json";
import aiTranslations from "./translations/modules/ai.json";
import eventsTranslations from "./translations/modules/events.json";
import orderTranslations from "./translations/modules/order.json";
import rolesTranslations from "./translations/modules/roles.json";
import assetsTranslations from "./translations/modules/assets.json";
import crmTranslations from "./translations/modules/crm.json";
import projectsTranslations from "./translations/modules/projects.json";
import accountingTranslations from "./translations/modules/accounting.json";
import hrTranslations from "./translations/modules/hr.json";

// Merge all translation modules
// IMPORTANT: projectsTranslations must come AFTER crmTranslations to avoid conflicts
// because crm.json has a simple "projects" string that would overwrite the projects object
const translationModules = [
  commonTranslations,
  authTranslations,
  layoutTranslations,
  productsTranslations,
  employeesTranslations,
  financeTranslations,
  procurementTranslations,
  customersTranslations,
  departmentsTranslations,
  signaturesTranslations,
  reportsTranslations,
  notificationsTranslations,
  performanceTranslations,
  settingsTranslations,
  warehouseTranslations,
  supportTranslations,
  aiTranslations,
  eventsTranslations,
  orderTranslations,
  rolesTranslations,
  assetsTranslations,
  crmTranslations,
  projectsTranslations, // Must be last to override any conflicts
  accountingTranslations,
  hrTranslations,
];

// Helper function for deep merge
const deepMerge = (target, source) => {
  if (!source) return target || {};
  if (!target) return source || {};
  const output = { ...target };
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    // If both are objects (and not arrays), merge them recursively
    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      targetValue !== undefined &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      output[key] = deepMerge(targetValue, sourceValue);
    } else if (
      // If target is an object and source is a primitive, keep the object (don't overwrite)
      targetValue !== undefined &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue) &&
      (typeof sourceValue !== 'object' || sourceValue === null || Array.isArray(sourceValue))
    ) {
      // Keep the existing object, don't overwrite with primitive
      // This prevents crm.json's "projects": "string" from overwriting projects.json's "projects": {...}
      output[key] = targetValue;
    } else {
      // Otherwise, use source value (it will overwrite target or add new key)
      output[key] = sourceValue;
    }
  });
  return output;
};

// Merge all translations by language
const resources = {};
translationModules.forEach((module, moduleIndex) => {
  Object.keys(module).forEach((lang) => {
    if (!resources[lang]) {
      resources[lang] = { translation: {} };
    }
    // Deep merge to avoid overwriting nested objects
    if (module[lang]?.translation) {
      resources[lang].translation = deepMerge(
        resources[lang].translation,
        module[lang].translation
      );
    }
  });
});

// מיפוי כיווני שפה
const directionMap = {
  en: "ltr",
  he: "rtl",
  ru: "ltr",
  ja: "ltr",
  zh: "ltr",
  fr: "ltr",
  es: "ltr",
};

i18n
  .use(LanguageDetector) // גילוי שפה אוטומטי
  .use(initReactI18next) // חיבור ל-React
  .init({
    resources,
    fallbackLng: "en", // שפה ברירת מחדל
    defaultNS: "translation",
    ns: ["translation"],
    interpolation: {
      escapeValue: false, // React כבר מבצע סניטיזציה
    },
    detection: {
      // אפשרויות זיהוי שפה
      order: [
        "queryString",
        "cookie",
        "localStorage",
        "navigator",
        "htmlTag",
        "path",
        "subdomain",
      ],
      caches: ["localStorage", "cookie"],
    },
    react: {
      useSuspense: false,
    },
    debug: false, // Set to true for debugging
    returnEmptyString: false,
    returnNull: false,
  });


// עדכון כיוון הדף בעת שינוי שפה
i18n.on("languageChanged", (lng) => {
  document.documentElement.dir = directionMap[lng] || "ltr";
});

// הגדרת כיוון הדף בעת טעינת שפה ראשונית
document.documentElement.dir = directionMap[i18n.language] || "ltr";

export default i18n;
