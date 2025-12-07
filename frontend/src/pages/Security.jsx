import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Security = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const securityFeatures = [
    {
      icon: "🔐",
      title: "הצפנה ברמת בנקאות",
      description: "כל המידע מוצפן בהצפנת AES-256 bit, התקן הגבוה ביותר בתעשייה."
    },
    {
      icon: "🔒",
      title: "אימות דו-שלבי (2FA)",
      description: "שכבת אבטחה נוספת להגנה על החשבון שלך מפני גישה לא מורשית."
    },
    {
      icon: "💾",
      title: "גיבויים אוטומטיים",
      description: "גיבוי מלא של כל הנתונים שלך מתבצע אוטומטית מדי יום במספר מיקומים."
    },
    {
      icon: "🛡️",
      title: "חומת אש מתקדמת",
      description: "הגנה פעילה 24/7 מפני התקפות סייבר ואיומי אבטחה."
    },
    {
      icon: "👁️",
      title: "מעקב ואיתור פעילות",
      description: "רישום מלא של כל הפעולות במערכת לאיתור חריגות ומניעת הונאות."
    },
    {
      icon: "✅",
      title: "תאימות תקנים",
      description: "עומדים בכל התקנים והרגולציות: GDPR, ISO 27001, SOC 2."
    },
    {
      icon: "🔑",
      title: "ניהול הרשאות מתקדם",
      description: "שליטה מלאה על מי רואה מה - הרשאות גמישות לפי תפקידים."
    },
    {
      icon: "🚨",
      title: "התראות אבטחה",
      description: "קבל התראות מיידיות על כל פעילות חשודה או ניסיון גישה לא מורשה."
    }
  ];

  const compliance = [
    { name: "GDPR", description: "תקנת הגנת המידע האירופית" },
    { name: "ISO 27001", description: "תקן בינלאומי לאבטחת מידע" },
    { name: "SOC 2", description: "ביקורת אבטחה עצמאית" },
    { name: "PCI DSS", description: "אבטחת תשלומים" }
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
            className="text-8xl mb-6"
          >
            🔒
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white"
          >
            אבטחה ברמה הגבוהה ביותר
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            המידע העסקי שלך מוגן בטכנולוגיות האבטחה המתקדמות ביותר
          </motion.p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl shadow-lg text-center"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 
                  className="text-lg font-bold mb-3"
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

      {/* Compliance */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            תאימות תקנים בינלאומיים
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {compliance.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl text-center backdrop-blur-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                <p className="text-sm text-white" style={{ opacity: 0.9 }}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Security;

