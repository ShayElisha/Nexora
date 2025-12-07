import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const API = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const endpoints = [
    {
      method: "GET",
      endpoint: "/api/v1/employees",
      description: "קבלת רשימת עובדים",
      color: "#10B981"
    },
    {
      method: "POST",
      endpoint: "/api/v1/employees",
      description: "יצירת עובד חדש",
      color: "#3B82F6"
    },
    {
      method: "PUT",
      endpoint: "/api/v1/employees/:id",
      description: "עדכון עובד",
      color: "#F59E0B"
    },
    {
      method: "DELETE",
      endpoint: "/api/v1/employees/:id",
      description: "מחיקת עובד",
      color: "#EF4444"
    }
  ];

  const features = [
    {
      icon: "🔐",
      title: "אבטחה מלאה",
      description: "API Token + OAuth 2.0"
    },
    {
      icon: "⚡",
      title: "ביצועים גבוהים",
      description: "זמן תגובה < 100ms"
    },
    {
      icon: "📊",
      title: "Rate Limiting",
      description: "10,000 בקשות לשעה"
    },
    {
      icon: "🔄",
      title: "Webhooks",
      description: "התראות בזמן אמת"
    }
  ];

  const codeExample = `// Example: Get All Employees
const response = await fetch('https://api.nexora.com/v1/employees', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json'
  }
});

const employees = await response.json();
console.log(employees);`;

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
            ⚙️
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold mb-6 text-white"
          >
            Nexora API
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            API רב עוצמה ליצירת אינטגרציות מותאמות אישית
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg text-center"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 
                  className="text-lg font-bold mb-2"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-20" style={{ backgroundColor: 'var(--bg-color)' }}>
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
            דוגמאות Endpoints
          </h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg flex items-center gap-6"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span 
                  className="px-4 py-2 rounded-lg font-bold text-white text-sm"
                  style={{ backgroundColor: endpoint.color }}
                >
                  {endpoint.method}
                </span>
                <code 
                  className="flex-1 font-mono text-sm"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {endpoint.endpoint}
                </code>
                <span 
                  className="text-sm"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {endpoint.description}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 
            className="text-3xl font-bold mb-8 text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            דוגמת קוד
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: '#1e293b' }}
          >
            <div className="p-4 flex items-center gap-2" style={{ backgroundColor: '#0f172a' }}>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-green-400 font-mono">
                {codeExample}
              </code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            מוכן להתחיל?
          </h2>
          <p className="text-lg text-white mb-8" style={{ opacity: 0.9 }}>
            קבל את ה-API Key שלך והתחל לבנות אינטגרציות מדהימות
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              className="py-3 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
              style={{
                backgroundColor: 'white',
                color: 'var(--color-primary)'
              }}
            >
              קרא תיעוד מלא 📚
            </button>
            <button
              className="py-3 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white'
              }}
            >
              קבל API Key 🔑
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default API;

