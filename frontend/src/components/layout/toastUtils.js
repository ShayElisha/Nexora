// toastUtils.js
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

// פונקציה להצגת טוסט הצלחה עם קונפטי למשך 15 שניות
export const showSuccessToastWithConfetti = (message) => {
  // מציגים טוסט הצלחה
  toast.success(message);

  const duration = 15000; // 15 שניות
  const end = Date.now() + duration;

  // מערך צבעים למגוון צבעים
  const colors = [
    "#FF0D00", // אדום
    "#FF8C00", // כתום
    "#FFD700", // זהוב
    "#008000", // ירוק
    "#00FFFF", // תכלת
    "#0000FF", // כחול
    "#8A2BE2", // סגול
    "#FF1493", // ורוד
  ];

  // הפעלת אנימציית הקונפטי בעזרת פונקציה רקורסיבית
  (function frame() {
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
      zIndex: 2000,
    });
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
      zIndex: 2000,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

// פונקציה לשמירת דגל ב-localStorage להצגה לאחר רענון הדף
export const setConfettiFlag = () => {
  localStorage.setItem("showConfetti", "true");
};
