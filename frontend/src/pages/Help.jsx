import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

const Help = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    {
      icon: "🚀",
      title: "התחלה מהירה",
      articles: 15,
      description: "כל מה שצריך כדי להתחיל"
    },
    {
      icon: "👥",
      title: "ניהול עובדים",
      articles: 24,
      description: "הוספה, עריכה ומעקב"
    },
    {
      icon: "💰",
      title: "פיננסים ותקציבים",
      articles: 18,
      description: "ניהול כספי ודוחות"
    },
    {
      icon: "📦",
      title: "מלאי ורכש",
      articles: 21,
      description: "ניהול מלאי והזמנות"
    },
    {
      icon: "🤝",
      title: "לקוחות וספקים",
      articles: 16,
      description: "CRM וקשרי ספקים"
    },
    {
      icon: "⚙️",
      title: "הגדרות והתאמות",
      articles: 12,
      description: "התאמה אישית"
    }
  ];

  const faq = [
    {
      question: "איך אני מתחיל להשתמש במערכת?",
      answer: "לאחר ההרשמה, תקבל מייל עם פרטי גישה. היכנס למערכת, עבור את האשף ההתחלתי ותוכל להתחיל לעבוד!"
    },
    {
      question: "האם אפשר לייבא נתונים ממערכת קודמת?",
      answer: "כן! אנחנו תומכים בייבוא מ-Excel, CSV ומערכות ERP מובילות. פנה לתמיכה לסיוע."
    },
    {
      question: "כמה עולה המערכת?",
      answer: "יש לנו מספר חבילות מחירים. לפרטים מלאים בקר בעמוד התמחור שלנו."
    },
    {
      question: "האם יש תמיכה בעברית?",
      answer: "בהחלט! המערכת והתמיכה שלנו זמינות בעברית מלאה 24/7."
    },
    {
      question: "איך אני מגבה את הנתונים?",
      answer: "המערכת מבצעת גיבוי אוטומטי יומי. תוכל גם לייצא נתונים בכל עת."
    }
  ];

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Hero */}
      <section 
        className="py-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold mb-6 text-white"
          >
            🙋 מרכז העזרה
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white mb-8"
            style={{ opacity: 0.9 }}
          >
            איך נוכל לעזור לך היום?
          </motion.p>
          
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש מאמרים, מדריכים ותשובות..."
              className="w-full p-4 rounded-xl text-lg shadow-xl"
              style={{
                backgroundColor: 'white',
                color: 'var(--text-color)',
                border: 'none'
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-3xl font-bold mb-12 text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            קטגוריות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-6xl mb-4">{category.icon}</div>
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {category.title}
                </h3>
                <p 
                  className="text-sm mb-3"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {category.description}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {category.articles} מאמרים
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section 
        className="py-20"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <h2 
            className="text-3xl font-bold mb-12 text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            שאלות נפוצות
          </h2>
          <div className="space-y-4">
            {faq.map((item, index) => (
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
                <h3 
                  className="text-lg font-bold mb-3"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {item.question}
                </h3>
                <p 
                  className="leading-relaxed"
                  style={{ color: 'var(--text-color)', opacity: 0.9 }}
                >
                  {item.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            לא מצאת מה שחיפשת?
          </h2>
          <p className="text-lg text-white mb-8" style={{ opacity: 0.9 }}>
            הצוות שלנו כאן לעזור! פנה אלינו בכל שאלה
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="py-3 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
              style={{
                backgroundColor: 'white',
                color: 'var(--color-primary)'
              }}
            >
              צור קשר 📧
            </Link>
            <button
              className="py-3 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white'
              }}
            >
              פתח צ'אט 💬
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Help;

