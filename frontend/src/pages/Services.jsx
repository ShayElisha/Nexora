import React from "react";

const Services = () => {
  return (
    <div className="bg-bg min-h-screen text-text">
      {/* אזור ה-Hero העליון */}
      <div className="bg-gradient-to-r from-primary to-secondary py-12 text-center text-white">
        <h1 className="text-4xl font-extrabold mb-2">השירותים שלנו</h1>
        <p className="text-sm max-w-xl mx-auto">
          כאן תוכלו למצוא פירוט אודות מגוון השירותים שאנחנו מציעים עבורכם
        </p>
      </div>

      {/* אזור התוכן הראשי */}
      <section className="py-10 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* כותרת ביניים - אפשר להסיר אם לא צריך */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">מה אנחנו מציעים?</h2>
            <p className="max-w-2xl mx-auto">
              צוות המומחים שלנו מספק פתרונות מקיפים במגוון תחומים, תוך התאמה
              לצרכים הייחודיים של כל לקוח.
            </p>
          </div>

          {/* רשת כרטיסי שירותים */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* כרטיס שירות 1 */}
            <div className="bg-white shadow rounded-lg p-6 border border-border-color hover:shadow-md transition-shadow">
              <div className="text-center mb-4">
                {/* אייקון או תמונה (לא חובה) */}
                <div className="w-16 h-16 mx-auto mb-3 bg-primary rounded-full flex items-center justify-center text-white text-2xl">
                  {/* דוגמה לאייקון - אפשר להחליף ב-<img /> או אייקון מספרייה */}
                  <i className="fas fa-cogs"></i>
                </div>
                <h3 className="text-xl font-bold">פיתוח מערכות</h3>
              </div>
              <p className="leading-relaxed">
                אנו מתמחים בתכנון ופיתוח מערכות טכנולוגיות מתקדמות, התאמה אישית
                של תוכנה, ושיפור תהליכים ארגוניים. כל זאת בעזרת טכנולוגיות
                חדשניות ובסטנדרטים גבוהים של אבטחת מידע.
              </p>
            </div>

            {/* כרטיס שירות 2 */}
            <div className="bg-white shadow rounded-lg p-6 border border-border-color hover:shadow-md transition-shadow">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary rounded-full flex items-center justify-center text-white text-2xl">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3 className="text-xl font-bold">ייעוץ עסקי</h3>
              </div>
              <p className="leading-relaxed">
                שירותי ייעוץ וליווי אסטרטגי, ניתוח שווקים, הטמעת מתודולוגיות
                ניהול, ושיפור תהליכי מכירה. בעזרתנו תוכלו לייעל את הפעילות
                העסקית ולהשיג את היעדים שלכם ביעילות.
              </p>
            </div>

            {/* כרטיס שירות 3 */}
            <div className="bg-white shadow rounded-lg p-6 border border-border-color hover:shadow-md transition-shadow">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary rounded-full flex items-center justify-center text-white text-2xl">
                  <i className="fas fa-user-shield"></i>
                </div>
                <h3 className="text-xl font-bold">אבטחת מידע וסייבר</h3>
              </div>
              <p className="leading-relaxed">
                הגנת סייבר, ניהול סיכונים ובדיקות חדירה (Penetration Tests), לצד
                פריסת מנגנוני אבטחת מידע מתקדמים. אנו דואגים לעמוד בתקני אבטחה
                מחמירים ולשמור על שלמות הנתונים שלכם.
              </p>
            </div>

            {/* כרטיס שירות 4 */}
            <div className="bg-white shadow rounded-lg p-6 border border-border-color hover:shadow-md transition-shadow">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary rounded-full flex items-center justify-center text-white text-2xl">
                  <i className="fas fa-laptop-code"></i>
                </div>
                <h3 className="text-xl font-bold">פיתוח אתרים ואפליקציות</h3>
              </div>
              <p className="leading-relaxed">
                בניית אתרים מודרניים רספונסיביים, פיתוח אפליקציות מובייל, ושילוב
                חוויית משתמש (UX/UI) מתקדמת. אנחנו נתאים את הפתרון הדיגיטלי
                המושלם עבורכם.
              </p>
            </div>

            {/* כרטיס שירות 5 */}
            <div className="bg-white shadow rounded-lg p-6 border border-border-color hover:shadow-md transition-shadow">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary rounded-full flex items-center justify-center text-white text-2xl">
                  <i className="fas fa-bullhorn"></i>
                </div>
                <h3 className="text-xl font-bold">שיווק דיגיטלי</h3>
              </div>
              <p className="leading-relaxed">
                קמפיינים במדיה חברתית, פרסום ממומן, קידום אתרים (SEO) ועוד. אנו
                משלבים יצירתיות, ניתוח דאטה והבנה מעמיקה של קהל היעד כדי למקסם
                את החשיפה והמכירות.
              </p>
            </div>

            {/* כרטיס שירות 6 */}
            <div className="bg-white shadow rounded-lg p-6 border border-border-color hover:shadow-md transition-shadow">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-primary rounded-full flex items-center justify-center text-white text-2xl">
                  <i className="fas fa-network-wired"></i>
                </div>
                <h3 className="text-xl font-bold">תשתיות וענן</h3>
              </div>
              <p className="leading-relaxed">
                פריסת פתרונות ענן, ניהול שרתים ותשתיות IT, אוטומציה של תהליכים
                וצמצום עלויות תפעול. אנו נסייע לכם לעבור לענן בצורה בטוחה
                ויעילה.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
