import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Integrations = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const integrations = [
    {
      category: "תקשורת ושיתוף פעולה",
      tools: [
        { name: "Slack", icon: "💬", description: "התראות וצ'אט צוות" },
        { name: "Microsoft Teams", icon: "👥", description: "פגישות ושיתוף" },
        { name: "Zoom", icon: "📹", description: "ועידות וידאו" },
        { name: "Gmail", icon: "📧", description: "מייל עסקי" }
      ]
    },
    {
      category: "ניהול פרויקטים",
      tools: [
        { name: "Trello", icon: "📋", description: "ניהול משימות" },
        { name: "Asana", icon: "✅", description: "מעקב פרויקטים" },
        { name: "Jira", icon: "🎯", description: "ניהול Agile" },
        { name: "Monday", icon: "📊", description: "ניהול עבודה" }
      ]
    },
    {
      category: "אחסון וקבצים",
      tools: [
        { name: "Google Drive", icon: "☁️", description: "אחסון ענן" },
        { name: "Dropbox", icon: "📦", description: "שיתוף קבצים" },
        { name: "OneDrive", icon: "📁", description: "אחסון Microsoft" },
        { name: "Box", icon: "🗄️", description: "ניהול מסמכים" }
      ]
    },
    {
      category: "כספים וחשבונאות",
      tools: [
        { name: "QuickBooks", icon: "💰", description: "הנהלת חשבונות" },
        { name: "Xero", icon: "📈", description: "ניהול כספי" },
        { name: "Stripe", icon: "💳", description: "תשלומים אונליין" },
        { name: "PayPal", icon: "💵", description: "סליקה" }
      ]
    },
    {
      category: "מכירות ושיווק",
      tools: [
        { name: "Salesforce", icon: "🤝", description: "CRM מתקדם" },
        { name: "HubSpot", icon: "🎨", description: "שיווק אוטומטי" },
        { name: "Mailchimp", icon: "📬", description: "דיוור ישיר" },
        { name: "Zapier", icon: "⚡", description: "אוטומציות" }
      ]
    },
    {
      category: "ניתוח ודוחות",
      tools: [
        { name: "Google Analytics", icon: "📊", description: "אנליטיקה" },
        { name: "Tableau", icon: "📉", description: "ויזואליזציה" },
        { name: "Power BI", icon: "📈", description: "דוחות מתקדמים" },
        { name: "Looker", icon: "🔍", description: "BI עסקי" }
      ]
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
            אינטגרציות עם הכלים שאתה אוהב
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            חבר את Nexora לכל הכלים שאתה כבר משתמש בהם ליעילות מקסימלית
          </motion.p>
        </div>
      </section>

      {/* Integrations by Category */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-16">
            {integrations.map((category, catIndex) => (
              <div key={catIndex}>
                <h2 
                  className="text-2xl md:text-3xl font-bold mb-8 text-center"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {category.category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.tools.map((tool, toolIndex) => (
                    <motion.div
                      key={toolIndex}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: toolIndex * 0.1 }}
                      className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                      style={{
                        backgroundColor: 'var(--bg-color)',
                        border: '2px solid var(--border-color)'
                      }}
                    >
                      <div className="text-5xl mb-3">{tool.icon}</div>
                      <h3 
                        className="text-lg font-bold mb-2"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {tool.name}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ color: 'var(--text-color)', opacity: 0.8 }}
                      >
                        {tool.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            API פתוח למפתחים
          </h2>
          <p className="text-lg text-white mb-8" style={{ opacity: 0.9 }}>
            צור אינטגרציות מותאמות אישית עם ה-API המתועד והידידותי שלנו
          </p>
          <button
            className="py-3 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            style={{
              backgroundColor: 'white',
              color: 'var(--color-primary)'
            }}
          >
            קרא את התיעוד 📚
          </button>
        </div>
      </section>
    </div>
  );
};

export default Integrations;

