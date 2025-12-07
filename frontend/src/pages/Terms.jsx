import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Terms = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const sections = [
    {
      title: "1. תנאים כלליים",
      content: "השימוש במערכת Nexora מהווה הסכמה מלאה לתנאי השימוש המפורטים במסמך זה. חשוב לקרוא את התנאים בעיון לפני תחילת השימוש."
    },
    {
      title: "2. רישיון שימוש",
      content: "Nexora מעניקה לך רישיון מוגבל, בלתי בלעדי, בלתי ניתן להעברה לשימוש במערכת למטרות עסקיות בלבד."
    },
    {
      title: "3. חשבון משתמש",
      content: "אתה אחראי לשמירה על סודיות פרטי החשבון שלך. כל פעילות שתתבצע בחשבון שלך היא באחריותך הבלעדית."
    },
    {
      title: "4. תשלומים והחזרים",
      content: "כל התשלומים מבוצעים באופן מאובטח. תנאי ביטול והחזר כספי יפורטו בהתאם לחבילת המנוי שנבחרה."
    },
    {
      title: "5. שירות ותמיכה",
      content: "אנו מתחייבים לספק שירות זמינות של 99.9%. תמיכה טכנית זמינה 24/7 דרך מרכז העזרה או הצ'אט שלנו."
    },
    {
      title: "6. הגבלת אחריות",
      content: "Nexora לא תהיה אחראית לנזקים עקיפים, מקריים או תוצאתיים הנובעים משימוש או אי-יכולת להשתמש במערכת."
    },
    {
      title: "7. שינויים בתנאים",
      content: "אנו שומרים את הזכות לשנות תנאים אלה בכל עת. שינויים מהותיים יובאו לידיעתך באמצעות מייל."
    },
    {
      title: "8. סיום שירות",
      content: "אתה רשאי לבטל את המנוי בכל עת. Nexora שומרת לעצמה את הזכות להשעות חשבון במקרה של הפרת תנאים."
    },
    {
      title: "9. קניין רוחני",
      content: "כל הזכויות במערכת, לרבות עיצוב, לוגו, קוד ותוכן הן רכושה הבלעדי של Nexora."
    },
    {
      title: "10. סמכות שיפוט",
      content: "תנאים אלה כפופים לדיני מדינת ישראל. כל מחלוקת תידון בבתי המשפט המוסמכים בישראל."
    }
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
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white"
          >
            תנאי שימוש
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white"
            style={{ opacity: 0.9 }}
          >
            עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}
          </motion.p>
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
                transition={{ delay: index * 0.1 }}
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

          {/* Contact */}
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
              יש שאלות?
            </h3>
            <p className="text-lg text-white mb-6" style={{ opacity: 0.9 }}>
              אנחנו כאן לעזור! פנה אלינו בכל שאלה או בירור
            </p>
            <Link
              to="/contact"
              className="inline-block py-3 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              style={{
                backgroundColor: 'white',
                color: 'var(--color-primary)'
              }}
            >
              צור קשר
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Terms;

