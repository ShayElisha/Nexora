import React, { useEffect, useState, useRef } from "react";

const DesignBox = () => {
  const themes = {
    default: {
      "--color-primary": "#1D4ED8", // כחול מקצועי (Blue-700)
      "--color-secondary": "#6B7280", // אפור נייטרלי (Gray-500)
      "--color-accent": "#10B981", // ירוק מרענן (Emerald-500)
      "--bg-color": "#F9FAFB", // רקע בהיר (Gray-50)
      "--text-color": "#111827", // טקסט כהה (Gray-900)
      "--button-bg": "#1D4ED8",
      "--button-text": "#FFFFFF",
      "--border-color": "#E5E7EB", // גבולות עדינים (Gray-200)
      "--footer-bg": "#F3F4F6", // רקע לפוטר (Gray-100)
    },
    royal: {
      "--color-primary": "#283593", // כחול מלכותי עמוק
      "--color-secondary": "#9C27B0", // סגול מלכותי
      "--color-accent": "#FFC107", // זהב נוצץ
      "--bg-color": "#FFFFFF",
      "--text-color": "#212121",
      "--button-bg": "#283593",
      "--button-text": "#FFFFFF",
      "--border-color": "#E0E0E0",
      "--footer-bg": "#F5F5F5",
    },
    opulent: {
      "--color-primary": "#800020", // בורגון עשיר
      "--color-secondary": "#D4AF37", // זהב יוקרתי
      "--color-accent": "#556B2F", // ירוק זית כהה
      "--bg-color": "#FFF8E1", // רקע קרם
      "--text-color": "#3E2723",
      "--button-bg": "#800020",
      "--button-text": "#FFFFFF",
      "--border-color": "#BCAAA4",
      "--footer-bg": "#FBE9E7",
    },
    elegant: {
      "--color-primary": "#424242", // אפור כהה
      "--color-secondary": "#757575", // אפור בינוני
      "--color-accent": "#9E9E9E", // אפור בהיר
      "--bg-color": "#FAFAFA", // רקע מאוד בהיר
      "--text-color": "#212121",
      "--button-bg": "#424242",
      "--button-text": "#FFFFFF",
      "--border-color": "#E0E0E0",
      "--footer-bg": "#F5F5F5",
    },
    modern: {
      "--color-primary": "#1976D2", // כחול בוהק
      "--color-secondary": "#0288D1", // כחול מעודן
      "--color-accent": "#00ACC1", // טורקיז מודרני
      "--bg-color": "#FFFFFF", // רקע לבן נקי
      "--text-color": "#212121",
      "--button-bg": "#1976D2",
      "--button-text": "#FFFFFF",
      "--border-color": "#E0E0E0",
      "--footer-bg": "#F1F1F1",
    },
    vintage: {
      "--color-primary": "#6D4C41", // חום קפה עשיר
      "--color-secondary": "#8D6E63", // חום עדין
      "--color-accent": "#FFB74D", // כתום חמים
      "--bg-color": "#FFF3E0", // קרם חמים
      "--text-color": "#3E2723",
      "--button-bg": "#6D4C41",
      "--button-text": "#FFFFFF",
      "--border-color": "#D7CCC8",
      "--footer-bg": "#FBE9E7",
    },
    midnight: {
      "--color-primary": "#0D47A1", // כחול לילה עמוק
      "--color-secondary": "#1565C0", // כחול מעודן
      "--color-accent": "#1976D2", // גוון כחול נעים
      "--bg-color": "#121212", // רקע כהה
      "--text-color": "#E0E0E0",
      "--button-bg": "#0D47A1",
      "--button-text": "#FFFFFF",
      "--border-color": "#424242",
      "--footer-bg": "#1E1E1E",
    },
    neon: {
      "--color-primary": "#00FFDD", // ניאון ציאן
      "--color-secondary": "#FF10F0", // ניאון מגנטה
      "--color-accent": "#7B42F6", // ניאון סגול
      "--bg-color": "#0A0A0B", // רקע כהה מאוד
      "--text-color": "#FFFFFF",
      "--button-bg": "#00FFDD",
      "--button-text": "#0A0A0B",
      "--border-color": "#7B42F6",
      "--footer-bg": "#0F0F11",
    },
  };

  // פונקציה שמחילה נושא
  const applyTheme = (themeName) => {
    const theme = themes[themeName];
    const root = document.documentElement;
    Object.keys(theme).forEach((key) => {
      root.style.setProperty(key, theme[key]);
    });
    // עדכון רקע הדף
    document.body.style.backgroundColor = theme["--bg-color"];
  };

  // נשתמש במצב (state) לאחסן את הנושא הנוכחי, נקרא מה- localStorage אם קיים, אחרת "default"
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("selectedTheme") || "default";
  });

  // בכל פעם שהנושא מתעדכן במצב, נחיל אותו ונעדכן ב־localStorage
  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem("selectedTheme", currentTheme);
  }, [currentTheme]);

  // ניהול פתיחה/סגירה של תיבת הבחירה
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // סגירת תיבה בלחיצה מחוץ לאזור
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  // פונקציה לבחירת נושא (בלחיצת כפתור) - מעדכנת את המצב
  const handleSelectTheme = (themeName) => {
    setCurrentTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50" ref={containerRef}>
      {/* כפתור פתיחה/סגירה */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-white p-2 rounded-full shadow hover:bg-gray-200 focus:outline-none"
      >
        <span role="img" aria-label="palette">
          🎨
        </span>
      </button>
      {/* תיבת הבחירה עם אנימציה */}
      <div
        className={`absolute bottom-full right-0 mb-2 bg-white p-4 rounded shadow-lg transition-all duration-300 transform ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-95 pointer-events-none"
        }`}
      >
        <h3 className="text-lg font-bold mb-2">בחר פלטת עיצובים</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(themes).map((themeName) => (
            <button
              key={themeName}
              onClick={() => handleSelectTheme(themeName)}
              className="px-3 py-1 border rounded transition-colors hover:bg-gray-200 focus:outline-none"
            >
              {themeName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignBox;
