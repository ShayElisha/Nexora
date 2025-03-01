import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="bg-bg min-h-screen text-text">
      {/* אזור כותרת עליון (Hero) */}
      <div className="bg-gradient-to-r from-primary to-secondary py-12 text-white text-center">
        <h1 className="text-4xl font-extrabold mb-2">מדיניות פרטיות</h1>
        <p className="text-sm">עודכן לאחרונה בתאריך: 20/02/2025</p>
      </div>

      {/* תוכן המדיניות */}
      <section className="pt-10 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto leading-relaxed">
          {/* פסקת פתיחה */}
          <p className="mb-6 text-lg">
            ברוכים הבאים לאתר שלנו <span className="italic">("האתר")</span>. אנו
            מכבדים את פרטיות המשתמשים שלנו, ומחויבים להגן על המידע האישי שנאסף
            באמצעות האתר. מטרת מדיניות פרטיות זו היא להבהיר כיצד אנו אוספים,
            משתמשים, מגנים ומשתפים מידע אישי של משתמשי האתר. השימוש באתר מהווה
            הסכמה למדיניות זו.
          </p>

          {/* סעיף 1 */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border border-border-color">
            <h2 className="text-2xl font-semibold mb-4 border-b border-border-color pb-2">
              1. איסוף מידע
            </h2>
            <p className="mb-4">
              <strong>מידע הנמסר מרצון:</strong> כאשר אתם משתמשים באתר, ייתכן
              שתתבקשו לספק מידע אישי מסוים, כגון שם, כתובת דוא"ל, מספר טלפון או
              פרטים אחרים, לצורך רישום, יצירת קשר או קבלת שירותים מגוונים.
            </p>
            <p>
              <strong>מידע הנאסף אוטומטית:</strong> בעת גלישה באתר, ייתכן שנאסוף
              מידע מסוים באופן אוטומטי כגון כתובת IP, סוג דפדפן, מערכת הפעלה,
              זמני גישה ודפי אינטרנט בהם ביקרתם.
            </p>
          </div>

          {/* סעיף 2 */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border border-border-color">
            <h2 className="text-2xl font-semibold mb-4 border-b border-border-color pb-2">
              2. שימוש במידע
            </h2>
            <p className="mb-4">אנו משתמשים במידע האישי שנאסף לצורך:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>אספקת שירותים וביצוע בקשותיכם.</li>
              <li>הפעלת האתר, התאמתו ושיפורו.</li>
              <li>
                תקשורת עם המשתמשים, כולל שליחת עדכונים, התראות או חומר פרסומי
                (רק באישורכם).
              </li>
              <li>ניתוח נתוני משתמשים ושיפור חוויית המשתמש באתר.</li>
              <li>אכיפת תנאי השימוש ומניעת פעילות הונאה או שימוש לרעה.</li>
            </ul>
          </div>

          {/* סעיף 3 */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border border-border-color">
            <h2 className="text-2xl font-semibold mb-4 border-b border-border-color pb-2">
              3. שמירת ואבטחת מידע
            </h2>
            <p>
              אנו נוקטים אמצעים ארגוניים וטכנולוגיים סבירים על מנת להגן על המידע
              האישי שלכם מפני גישה בלתי מורשית, אובדן או שימוש לרעה. עם זאת, יש
              לזכור כי אין שיטת אבטחה המבטיחה בטיחות מוחלטת ברשת האינטרנט.
            </p>
          </div>

          {/* סעיף 4 */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border border-border-color">
            <h2 className="text-2xl font-semibold mb-4 border-b border-border-color pb-2">
              4. שיתוף מידע עם צדדים שלישיים
            </h2>
            <p className="mb-4">אנו עשויים לשתף מידע אישי במקרים הבאים:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>עם ספקי שירות העובדים מטעמנו ומחויבים לשמירה על סודיות.</li>
              <li>כאשר אנו מחויבים לפי חוק או צו בית משפט.</li>
              <li>
                כאשר הדבר נדרש לצורך שמירה על זכויותינו המשפטיות או ביטחון
                משתמשינו.
              </li>
              <li>
                במידה ונמכור או נעביר את פעילותנו (או חלק ממנה) לצד שלישי, המידע
                עשוי לעבור איתה.
              </li>
            </ul>
          </div>

          {/* סעיף 5 */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border border-border-color">
            <h2 className="text-2xl font-semibold mb-4 border-b border-border-color pb-2">
              5. קבצי Cookie וטכנולוגיות דומות
            </h2>
            <p>
              האתר שלנו עשוי להשתמש ב"עוגיות" (Cookies) וטכנולוגיות דומות לצורך
              שיפור חוויית המשתמש, התאמת התוכן המוצג וניתוח תעבורת האתר.
              באפשרותכם לשלוט ולעדכן את הגדרות הדפדפן שלכם בנוגע לקבצי Cookie,
              אולם ייתכן שחלק מתכונות האתר לא יפעלו כראוי אם תבטלו אותם.
            </p>
          </div>

          {/* סעיף 6 */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border border-border-color">
            <h2 className="text-2xl font-semibold mb-4 border-b border-border-color pb-2">
              6. קישורים לאתרים חיצוניים
            </h2>
            <p>
              האתר עשוי להכיל קישורים לאתרים חיצוניים אשר אינם בשליטתנו. אין אנו
              אחראים למדיניות הפרטיות או לתוכן של אתרים אלו. אנו ממליצים לעיין
              במדיניות הפרטיות של כל אתר חיצוני לפני מסירת מידע אישי.
            </p>
          </div>

          {/* סעיף 7 */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border border-border-color">
            <h2 className="text-2xl font-semibold mb-4 border-b border-border-color pb-2">
              7. עדכונים למדיניות הפרטיות
            </h2>
            <p>
              אנו שומרים לעצמנו את הזכות לעדכן או לשנות את מדיניות הפרטיות הזו
              מעת לעת, כדי להתאים אותה לשינויים באתר או בשירותינו. תאריך העדכון
              האחרון יופיע בראש הדף. המשך השימוש באתר לאחר פרסום השינויים יהווה
              הסכמה שלכם למדיניות החדשה.
            </p>
          </div>

          {/* סעיף 8 */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow border border-border-color">
            <h2 className="text-2xl font-semibold mb-4 border-b border-border-color pb-2">
              8. יצירת קשר
            </h2>
            <p className="mb-2">
              אם יש לכם שאלות, הערות או בקשות בנוגע למדיניות הפרטיות או לאופן
              שבו אנו מטפלים במידע האישי שלכם, אנא צרו קשר באמצעות הדוא"ל:{" "}
              <a
                href="mailto:info@example.com"
                className="underline text-primary"
              >
                info@example.com
              </a>
              .
            </p>
            <p className="text-sm text-border-color">
              *מדיניות זו נכתבה כנוסח דוגמה ואינה מהווה ייעוץ משפטי. מומלץ
              להתייעץ עם איש מקצוע על מנת להתאים מדיניות פרטיות המתאימה לחוקים
              ולתקנות הרלוונטיים.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
