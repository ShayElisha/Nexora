// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import translations from "./translations.json";

const resources = Object.keys(translations).reduce((acc, lang) => {
  acc[lang] = {
    translation: translations[lang].translation,
  };
  return acc;
}, {});

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
  });

// עדכון כיוון הדף בעת שינוי שפה
i18n.on("languageChanged", (lng) => {
  document.documentElement.dir = directionMap[lng] || "ltr";
});

// הגדרת כיוון הדף בעת טעינת שפה ראשונית
document.documentElement.dir = directionMap[i18n.language] || "ltr";

export default i18n;
