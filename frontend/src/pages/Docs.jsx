import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";

const Docs = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [activeCategory, setActiveCategory] = useState("getting-started");

  const categories = [
    { id: "getting-started", icon: "🚀", title: "התחלה מהירה" },
    { id: "employees", icon: "👥", title: "ניהול עובדים" },
    { id: "finance", icon: "💰", title: "פיננסים" },
    { id: "inventory", icon: "📦", title: "מלאי" },
    { id: "api", icon: "⚙️", title: "API" },
    { id: "integrations", icon: "🔗", title: "אינטגרציות" }
  ];

  const docs = {
    "getting-started": [
      { title: "מדריך התחלה", time: "5 דקות" },
      { title: "יצירת חשבון", time: "3 דקות" },
      { title: "הגדרות ראשוניות", time: "10 דקות" },
      { title: "ייבוא נתונים", time: "15 דקות" }
    ],
    "employees": [
      { title: "הוספת עובד", time: "5 דקות" },
      { title: "ניהול משמרות", time: "10 דקות" },
      { title: "מעקב נוכחות", time: "8 דקות" },
      { title: "הערכות ביצועים", time: "12 דקות" }
    ],
    "finance": [
      { title: "ניהול תקציבים", time: "10 דקות" },
      { title: "דוחות כספיים", time: "15 דקות" },
      { title: "ניתוח רווחיות", time: "12 דקות" }
    ],
    "inventory": [
      { title: "הגדרת מלאי", time: "10 דקות" },
      { title: "הזמנות רכש", time: "8 דקות" },
      { title: "ניהול ספקים", time: "12 דקות" }
    ],
    "api": [
      { title: "תיעוד API", time: "20 דקות" },
      { title: "אימות", time: "5 דקות" },
      { title: "Webhooks", time: "10 דקות" }
    ],
    "integrations": [
      { title: "חיבור ל-Slack", time: "5 דקות" },
      { title: "חיבור ל-Gmail", time: "5 דקות" },
      { title: "חיבור ל-QuickBooks", time: "10 דקות" }
    ]
  };

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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl mb-6"
          >
            📚
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold mb-6 text-white"
          >
            מרכז התיעוד
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            כל מה שצריך לדעת על Nexora במקום אחד
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64">
              <div 
                className="p-6 rounded-xl shadow-lg sticky top-24"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <h3 
                  className="font-bold mb-4"
                  style={{ color: 'var(--color-primary)' }}
                >
                  קטגוריות
                </h3>
                <nav className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-right p-3 rounded-lg transition-all duration-300 flex items-center gap-3 ${
                        activeCategory === category.id 
                          ? 'shadow-md transform scale-105' 
                          : 'hover:scale-102'
                      }`}
                      style={{
                        backgroundColor: activeCategory === category.id 
                          ? 'var(--color-primary)' 
                          : 'transparent',
                        color: activeCategory === category.id 
                          ? 'var(--button-text)' 
                          : 'var(--text-color)'
                      }}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-semibold">{category.title}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {docs[activeCategory]?.map((doc, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                    style={{
                      backgroundColor: 'var(--bg-color)',
                      border: '2px solid var(--border-color)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 
                        className="text-lg font-bold"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {doc.title}
                      </h3>
                      <span 
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'white'
                        }}
                      >
                        {doc.time}
                      </span>
                    </div>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: 'var(--text-color)', opacity: 0.8 }}
                    >
                      מדריך מפורט שלב אחר שלב
                    </p>
                    <button 
                      className="text-sm font-semibold transition-all duration-300"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      קרא עוד →
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            סרטוני הדרכה
          </h2>
          <p className="text-lg text-white mb-8" style={{ opacity: 0.9 }}>
            למד דרך סרטונים קצרים ומעשיים
          </p>
          <button
            className="py-4 px-10 font-bold rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
            style={{
              backgroundColor: 'white',
              color: 'var(--color-primary)'
            }}
          >
            לערוץ YouTube שלנו 📹
          </button>
        </div>
      </section>
    </div>
  );
};

export default Docs;

