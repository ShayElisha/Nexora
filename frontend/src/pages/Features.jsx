import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Features = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const features = [
    {
      icon: "👥",
      title: "ניהול עובדים מתקדם",
      description: "מעקב אחר נוכחות, שעות עבודה, משמרות וביצועים. כל המידע במקום אחד.",
      features: ["ניהול נוכחות", "מעקב משמרות", "ניהול חופשות", "הערכות ביצועים"]
    },
    {
      icon: "💰",
      title: "ניהול פיננסי חכם",
      description: "שליטה מלאה על תזרים המזומנים, תקציבים והוצאות החברה.",
      features: ["תזרים מזומנים", "תקציבים", "דוחות כספיים", "ניתוח רווחיות"]
    },
    {
      icon: "📦",
      title: "ניהול מלאי ורכש",
      description: "אוטומציה מלאה של תהליכי הרכש וניהול מלאי חכם.",
      features: ["מעקב מלאי", "הזמנות רכש", "ניהול ספקים", "התראות מלאי"]
    },
    {
      icon: "🤝",
      title: "CRM מובנה",
      description: "ניהול לקוחות מתקדם עם מעקב אחר הזדמנויות ומכירות.",
      features: ["ניהול לידים", "מעקב עסקאות", "היסטוריית לקוח", "אוטומציה"]
    },
    {
      icon: "📊",
      title: "דוחות ותובנות",
      description: "דשבורדים מתקדמים עם תובנות עסקיות בזמן אמת.",
      features: ["דוחות מותאמים", "BI מתקדם", "תחזיות", "אנליטיקה"]
    },
    {
      icon: "🔗",
      title: "אינטגרציות",
      description: "התחברות חלקה לכל הכלים שאתה כבר משתמש בהם.",
      features: ["API פתוח", "Webhooks", "אינטגרציות מובנות", "ייבוא/ייצוא"]
    },
    {
      icon: "📱",
      title: "ניידות מלאה",
      description: "גישה לכל המערכת מכל מכשיר, בכל מקום ובכל זמן.",
      features: ["אפליקציה ניידת", "עיצוב רספונסיבי", "עבודה אופליין", "סנכרון אוטומטי"]
    },
    {
      icon: "🔒",
      title: "אבטחה מקסימלית",
      description: "הגנה מלאה על המידע העסקי שלך ברמת בנקאות.",
      features: ["הצפנה מלאה", "גיבויים יומיים", "2FA", "ניהול הרשאות"]
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
            תכונות מתקדמות לעסק המודרני
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-white"
            style={{ opacity: 0.9 }}
          >
            כל הכלים שאתה צריך לנהל את העסק שלך ביעילות מרבית
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 
                  className="text-xl font-bold mb-3"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="mb-4 text-sm"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li 
                      key={i}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--text-color)', opacity: 0.9 }}
                    >
                      <span style={{ color: 'var(--color-accent)' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;

