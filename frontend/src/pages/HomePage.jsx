// src/pages/HomePage.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const HomePage = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/create-company");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  // אפקט כתיבה עבור הסלוגן
  const [tagline, setTagline] = useState("");
  const fullTagline = "ניהול חכם לעסק שלך";
  useEffect(() => {
    let i = 0;
    const type = () => {
      if (i < fullTagline.length) {
        setTagline(fullTagline.slice(0, i + 1));
        i++;
        setTimeout(type, 100);
      }
    };
    type();
  }, []);

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-6 lg:px-8 overflow-hidden flex items-center justify-center">
      {/* חלקיקים מרחפים ברקע */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-40 h-40 bg-primary/20 rounded-full absolute top-10 left-10 animate-float" />
        <div className="w-24 h-24 bg-secondary/20 rounded-full absolute bottom-10 right-10 animate-float-delayed" />
        <div className="w-16 h-16 bg-accent/20 rounded-full absolute top-1/3 left-1/4 animate-float" />
      </div>

      {/* כרטיס תוכן מרכזי */}
      <div className="relative z-10 bg-accent p-6 sm:p-8 rounded-2xl shadow-2xl border bg-bg transform transition-all duration-500 hover:shadow-3xl hover:-translate-y-2 max-w-4xl w-full animate-fade-in-up">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent animate-rotate-border opacity-50 -z-10" />

        {/* תוכן ראשי */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text mb-3 tracking-tight drop-shadow-md animate-pulse-slow">
            ממשק ERP מתקדם
          </h1>
          <p className="text-lg sm:text-xl text-text/80 mb-4 font-mono">
            {tagline}
            <span className="animate-blink">|</span>
          </p>
          <p className="text-base sm:text-lg text-text/70 mb-6">
            נהל עובדים, רכש, הזמנות ולקוחות - הכל במקום אחד.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleSignUp}
              className="relative py-2 px-8 bg-button-bg text-button-text font-semibold rounded-full shadow-lg hover:bg-secondary hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform transition-all duration-300 group"
            >
              <span className="relative z-10">התחל עכשיו</span>
              <span className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
            </button>
            <button
              onClick={handleLogin}
              className="relative py-2 px-8 bg-transparent border border-primary text-primary font-semibold rounded-full shadow-lg hover:bg-primary hover:text-button-text hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform transition-all duration-300 group"
            >
              <span className="relative z-10">התחבר</span>
              <span className="absolute inset-0 bg-primary/10 rounded-full blur-md group-hover:blur-lg transition-all duration-300 opacity-0 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* תכונות */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-accent p-4 rounded-xl shadow-md border bg-bg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-primary">ניהול עובדים</h3>
            <p className="text-sm text-text/80">עקוב אחר ביצועים ומשמרות.</p>
          </div>
          <div className="bg-accent p-4 rounded-xl shadow-md border bg-bg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-primary">רכש והזמנות</h3>
            <p className="text-sm text-text/80">אוטומציה של תהליכים.</p>
          </div>
          <div className="bg-accent p-4 rounded-xl shadow-md border bg-bg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-primary">ניהול לקוחות</h3>
            <p className="text-sm text-text/80">CRM מובנה לשירות טוב יותר.</p>
          </div>
          <div className="bg-accent p-4 rounded-xl shadow-md border bg-bg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-primary">דוחות</h3>
            <p className="text-sm text-text/80">תובנות בזמן אמת.</p>
          </div>
          <div className="bg-accent p-4 rounded-xl shadow-md border bg-bg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-primary">אינטגרציה</h3>
            <p className="text-sm text-text/80">חיבור מהיר לכלים קיימים.</p>
          </div>
          <div className="bg-accent p-4 rounded-xl shadow-md border bg-bg hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-lg font-bold text-primary">זמינות</h3>
            <p className="text-sm text-text/80">גישה מכל מקום ובכל זמן.</p>
          </div>
        </div>

        {/* קריאה לפעולה סופית */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text mb-4 tracking-tight drop-shadow-md animate-pulse-slow">
            מוכן לשדרג את העסק?
          </h2>
          <button
            onClick={handleSignUp}
            className="relative py-3 px-10 bg-button-bg text-button-text font-semibold rounded-full shadow-lg hover:bg-secondary hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform transition-all duration-300 group"
          >
            <span className="relative z-10">נסה בחינם</span>
            <span className="absolute inset-0 bg-primary/30 rounded-full blur-lg group-hover:blur-xl transition-all duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
