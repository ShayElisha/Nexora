import React, { useEffect } from "react";

const DesignBox = () => {
  const themes = {
    default: {
      "--color-primary": "#3B82F6", // כחול מודרני (Blue-500)
      "--color-secondary": "#854836", // צהוב חמים (Amber-500)
      "--color-accent": "#FFB22C", // ירוק מרענן (Emerald-500)
      "--bg-color": "#F7F7F7", // רקע בהיר (Gray-100)
      "--text-color": "#000000", // טקסט כהה (Gray-800)
      "--button-bg": "#3B82F6",
      "--button-text": "#ffffff",
      "--border-color": "#D1D5DB", // גבולות עדינים (Gray-300)
      "--footer-bg": "#E5E7EB", // רקע לפוטר (Gray-200)
    },
    royal: {
      "--color-primary": "#283593", // כחול מלכותי עמוק
      "--color-secondary": "#FFD700", // זהב נוצץ
      "--color-accent": "#B0BEC5", // כסף עדין
      "--bg-color": "#F7F7F7", // רקע בהיר נעים
      "--text-color": "#212121", // טקסט כהה
      "--button-bg": "#283593",
      "--button-text": "#ffffff",
      "--border-color": "#D1D5DB", // גבולות עדינים בגוון אפור בהיר
      "--footer-bg": "#E8EAF6", // רקע לפוטר בגוון כחול-לבני
    },
    opulent: {
      "--color-primary": "#800020", // בורגון עשיר
      "--color-secondary": "#D4AF37", // זהב מוארך
      "--color-accent": "#556B2F", // ירוק זית כהה
      "--bg-color": "#FFF8E1", // רקע קרם
      "--text-color": "#3E2723", // טקסט חום כהה
      "--button-bg": "#800020",
      "--button-text": "#ffffff",
      "--border-color": "#BCAAA4", // גבולות בגוון חום עדין
      "--footer-bg": "#FBE9E7", // רקע לפוטר בגוון פסטלי חמים
    },
    elegant: {
      "--color-primary": "#424242", // אפור כהה
      "--color-secondary": "#9E9E9E", // אפור בהיר
      "--color-accent": "#616161", // אפור בינוני
      "--bg-color": "#FAFAFA", // רקע מאוד בהיר
      "--text-color": "#212121", // טקסט כהה
      "--button-bg": "#424242",
      "--button-text": "#ffffff",
      "--border-color": "#E0E0E0", // גבולות בהירים
      "--footer-bg": "#F5F5F5", // רקע לפוטר בהיר
    },
    modern: {
      "--color-primary": "#1976D2", // כחול בוהק
      "--color-secondary": "#00ACC1", // טורקיז מודרני
      "--color-accent": "#FF4081", // ורוד בהיר נועז
      "--bg-color": "#FFFFFF", // רקע לבן נקי
      "--text-color": "#212121", // טקסט כהה
      "--button-bg": "#1976D2",
      "--button-text": "#ffffff",
      "--border-color": "#E0E0E0", // גבולות עדינים
      "--footer-bg": "#F1F1F1", // רקע לפוטר בהיר
    },
    vintage: {
      "--color-primary": "#6D4C41", // חום קפה עשיר
      "--color-secondary": "#A1887F", // חום עדין
      "--color-accent": "#FFB74D", // כתום חמים
      "--bg-color": "#FFF3E0", // רקע קרם עם נגיעות חמות
      "--text-color": "#3E2723", // טקסט חום כהה
      "--button-bg": "#6D4C41",
      "--button-text": "#ffffff",
      "--border-color": "#D7CCC8", // גבולות עדינים בגוון טבעי
      "--footer-bg": "#FBE9E7", // רקע לפוטר בגוון נעים
    },
    midnight: {
      "--color-primary": "#0D47A1", // כחול לילה עמוק
      "--color-secondary": "#1976D2", // כחול בהיר מעט
      "--color-accent": "#B0BEC5", // גוון כחול-אפור
      "--bg-color": "#121212", // רקע כמעט שחור אחיד
      "--text-color": "#E0E0E0", // טקסט בהיר
      "--button-bg": "#0D47A1",
      "--button-text": "#ffffff",
      "--border-color": "#424242", // גבולות כהים
      "--footer-bg": "#1E1E1E", // רקע לפוטר כהה
    },
  };

  const applyTheme = (themeName) => {
    const theme = themes[themeName];
    const root = document.documentElement;
    Object.keys(theme).forEach((key) => {
      root.style.setProperty(key, theme[key]);
    });
    // עדכון רקע הדף בהתאם למשתנה --bg-color
    document.body.style.backgroundColor = theme["--bg-color"];
  };

  // בעת טעינת הרכיב, מגדירים את נושא ברירת המחדל "default"
  useEffect(() => {
    applyTheme("default");
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg z-50">
      <h3 className="text-lg font-bold mb-2">בחר פלטת עיצובים</h3>
      <div className="flex space-x-2">
        {Object.keys(themes).map((themeName) => (
          <button
            key={themeName}
            onClick={() => applyTheme(themeName)}
            className="px-3 py-1 border rounded transition-colors hover:bg-gray-200"
          >
            {themeName}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DesignBox;
