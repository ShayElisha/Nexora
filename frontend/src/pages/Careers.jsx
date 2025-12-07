import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Careers = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const positions = [
    {
      title: "מפתח Full Stack",
      department: "פיתוח",
      location: "תל אביב",
      type: "משרה מלאה",
      icon: "💻"
    },
    {
      title: "מנהל מוצר",
      department: "מוצר",
      location: "תל אביב / היברידי",
      type: "משרה מלאה",
      icon: "🎯"
    },
    {
      title: "מעצב UX/UI",
      department: "עיצוב",
      location: "מרחוק",
      type: "משרה מלאה",
      icon: "🎨"
    },
    {
      title: "איש מכירות בכיר",
      department: "מכירות",
      location: "תל אביב",
      type: "משרה מלאה",
      icon: "💼"
    },
    {
      title: "מומחה תמיכה טכנית",
      department: "תמיכה",
      location: "מרחוק",
      type: "משרה חלקית / מלאה",
      icon: "🛠️"
    },
    {
      title: "מנהל שיווק דיגיטלי",
      department: "שיווק",
      location: "תל אביב",
      type: "משרה מלאה",
      icon: "📱"
    }
  ];

  const benefits = [
    { icon: "💰", title: "שכר תחרותי", description: "מעל ממוצע השוק" },
    { icon: "🏖️", title: "חופשה נדיבה", description: "25 ימי חופשה + ימי מחלה" },
    { icon: "🏠", title: "עבודה היברידית", description: "גמישות מלאה" },
    { icon: "📚", title: "הדרכות", description: "תקציב פיתוח מקצועי" },
    { icon: "🍕", title: "ארוחות", description: "ארוחות וכיבוד" },
    { icon: "🎉", title: "אירועים", description: "פעילויות צוות" },
    { icon: "💪", title: "כושר", description: "מנוי חדר כושר" },
    { icon: "🚗", title: "חניה", description: "חניה בחינם" }
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
            הצטרף למשפחת Nexora
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            בנה איתנו את העתיד של ניהול עסקי
          </motion.p>
        </div>
      </section>

      {/* Benefits */}
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
            למה לעבוד אצלנו?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-6 rounded-xl shadow-lg text-center"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-5xl mb-3">{benefit.icon}</div>
                <h3 
                  className="font-bold mb-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {benefit.title}
                </h3>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
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
            משרות פתוחות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {positions.map((position, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{position.icon}</div>
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span 
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: 'var(--color-secondary)',
                          color: 'white'
                        }}
                      >
                        {position.department}
                      </span>
                      <span 
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'white'
                        }}
                      >
                        {position.location}
                      </span>
                      <span 
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-color)'
                        }}
                      >
                        {position.type}
                      </span>
                    </div>
                    <button 
                      className="text-sm font-semibold py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105"
                      style={{
                        background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                        color: 'white'
                      }}
                    >
                      הגש מועמדות →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;

