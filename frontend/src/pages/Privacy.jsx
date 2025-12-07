import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Privacy = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const sections = [
    {
      title: "1. איזה מידע אנחנו אוספים",
      content: "אנו אוספים מידע שאתה מספק בעת יצירת חשבון: שם, מייל, טלפון, פרטי החברה. בנוסף, אנו אוספים מידע על השימוש במערכת לשיפור השירות."
    },
    {
      title: "2. כיצד אנו משתמשים במידע",
      content: "המידע משמש למתן השירות, שיפור המוצר, תמיכה טכנית, תקשורת שוטפת ועמידה בדרישות החוק."
    },
    {
      title: "3. אבטחת המידע",
      content: "אנו משתמשים בהצפנת AES-256, גיבויים יומיים, חומת אש מתקדמת ופרוטוקולי אבטחה מחמירים להגנה על המידע שלך."
    },
    {
      title: "4. שיתוף מידע עם צדדים שלישיים",
      content: "אנו לא מוכרים או משכירים את המידע שלך. שיתוף מתבצע רק עם ספקי שירות הכרחיים כגון אחסון ענן ומעבדי תשלומים."
    },
    {
      title: "5. עוגיות (Cookies)",
      content: "אנו משתמשים בעוגיות לשיפור חוויית המשתמש, זיהוי פעילות חשודה ואנליטיקה. ניתן לנהל העדפות עוגיות בהגדרות הדפדפן."
    },
    {
      title: "6. זכויות המשתמש",
      content: "יש לך זכות לגשת למידע שלך, לתקן, למחוק, להגביל עיבוד או להתנגד לעיבוד. ניתן לממש זכויות אלה דרך הגדרות החשבון או פנייה אלינו."
    },
    {
      title: "7. שמירת מידע",
      content: "אנו שומרים את המידע כל עוד החשבון פעיל ו-90 יום נוספים לאחר סגירת חשבון, אלא אם החוק מחייב אחרת."
    },
    {
      title: "8. העברות מידע בינלאומיות",
      content: "המידע מאוחסן בשרתים מאובטחים באיחוד האירופי. כל העברה תתבצע בהתאם ל-GDPR ותקנות הגנת מידע."
    },
    {
      title: "9. פרטיות ילדים",
      content: "השירות מיועד למשתמשים מעל גיל 18. אנו לא אוספים במודע מידע מילדים מתחת לגיל 18."
    },
    {
      title: "10. שינויים במדיניות",
      content: "אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יובאו לידיעתך באמצעות מייל או הודעה במערכת."
    }
  ];

  const rights = [
    { icon: "✅", text: "גישה למידע" },
    { icon: "✏️", text: "תיקון מידע" },
    { icon: "🗑️", text: "מחיקת מידע" },
    { icon: "⛔", text: "הגבלת עיבוד" },
    { icon: "📦", text: "ניידות מידע" },
    { icon: "🚫", text: "התנגדות לעיבוד" }
  ];

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Hero Section */}
      <section 
        className="py-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl mb-6"
          >
            🔒
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white"
          >
            מדיניות פרטיות
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white"
            style={{ opacity: 0.9 }}
          >
            הפרטיות שלך חשובה לנו | עודכן: {new Date().toLocaleDateString('he-IL')}
          </motion.p>
        </div>
      </section>

      {/* Rights Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-3xl font-bold mb-8 text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            הזכויות שלך
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {rights.map((right, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl text-center shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-4xl mb-2">{right.icon}</div>
                <p 
                  className="text-xs font-semibold"
                  style={{ color: 'var(--text-color)' }}
                >
                  {right.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-6 rounded-xl shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h2 
                  className="text-xl font-bold mb-4"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {section.title}
                </h2>
                <p 
                  className="leading-relaxed"
                  style={{ color: 'var(--text-color)', opacity: 0.9 }}
                >
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Contact for Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 rounded-xl text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`,
            }}
          >
            <h3 className="text-2xl font-bold mb-4 text-white">
              שאלות לגבי הפרטיות שלך?
            </h3>
            <p className="text-lg text-white mb-6" style={{ opacity: 0.9 }}>
              צור איתנו קשר למימוש זכויותיך או לכל שאלה
            </p>
            <a
              href="mailto:privacy@nexora.com"
              className="inline-block py-3 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              style={{
                backgroundColor: 'white',
                color: 'var(--color-primary)'
              }}
            >
              privacy@nexora.com
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;

