import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Partners = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const partnerTypes = [
    {
      icon: "🤝",
      title: "שותפים טכנולוגיים",
      description: "חברות טכנולוגיה שמשלבות את Nexora במוצרים שלהם",
      benefits: ["עמלות אטרקטיביות", "תמיכה טכנית", "חומרי שיווק"]
    },
    {
      icon: "💼",
      title: "שותפי הטמעה",
      description: "יועצים ומשרדים שמסייעים ללקוחות בהטמעת המערכת",
      benefits: ["הכשרה מלאה", "סיוע מכירה", "רווחים גבוהים"]
    },
    {
      icon: "🎓",
      title: "שותפי הדרכה",
      description: "מוסדות הדרכה המעבירים קורסים על Nexora",
      benefits: ["חומרי לימוד", "הסמכה", "קהילת מדריכים"]
    }
  ];

  const currentPartners = [
    { name: "Microsoft", logo: "🏢", description: "שותף טכנולוגי" },
    { name: "AWS", logo: "☁️", description: "תשתית ענן" },
    { name: "Stripe", logo: "💳", description: "שותף תשלומים" },
    { name: "Salesforce", logo: "🤝", description: "אינטגרציה" },
    { name: "Google", logo: "🔍", description: "שירותי ענן" },
    { name: "Zoom", logo: "📹", description: "תקשורת" }
  ];

  const benefits = [
    {
      icon: "💰",
      title: "הכנסות גבוהות",
      description: "עמלות אטרקטיביות על כל לקוח"
    },
    {
      icon: "📈",
      title: "פוטנציאל צמיחה",
      description: "שוק גדול ומתרחב"
    },
    {
      icon: "🛠️",
      title: "תמיכה מלאה",
      description: "סיוע טכני ושיווקי"
    },
    {
      icon: "🎯",
      title: "לידים איכותיים",
      description: "הפניות ממערכת ה-CRM שלנו"
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
            תוכנית השותפים של Nexora
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            הצטרף לרשת השותפים שלנו וצמח איתנו
          </motion.p>
        </div>
      </section>

      {/* Partner Types */}
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
            סוגי שותפויות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnerTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-7xl mb-4">{type.icon}</div>
                <h3 
                  className="text-2xl font-bold mb-4"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {type.title}
                </h3>
                <p 
                  className="mb-6 leading-relaxed"
                  style={{ color: 'var(--text-color)', opacity: 0.9 }}
                >
                  {type.description}
                </p>
                <ul className="space-y-2">
                  {type.benefits.map((benefit, i) => (
                    <li 
                      key={i}
                      className="flex items-center gap-2"
                      style={{ color: 'var(--text-color)' }}
                    >
                      <span style={{ color: 'var(--color-accent)' }}>✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
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
            היתרונות שלך
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg text-center"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-6xl mb-4">{benefit.icon}</div>
                <h3 
                  className="text-lg font-bold mb-2"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {benefit.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Partners */}
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
            השותפים שלנו
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {currentPartners.map((partner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg text-center hover:scale-105 transition-transform duration-300"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-5xl mb-3">{partner.logo}</div>
                <h3 
                  className="font-bold mb-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {partner.name}
                </h3>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--text-color)', opacity: 0.7 }}
                >
                  {partner.description}
                </p>
              </motion.div>
            ))}
          </div>
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
            מוכן להצטרף?
          </h2>
          <p className="text-lg text-white mb-8" style={{ opacity: 0.9 }}>
            בואו ניצור שותפות מנצחת ביחד
          </p>
          <button
            className="py-4 px-10 font-bold rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
            style={{
              backgroundColor: 'white',
              color: 'var(--color-primary)'
            }}
          >
            הגש בקשה לשותפות 🤝
          </button>
        </div>
      </section>
    </div>
  );
};

export default Partners;

