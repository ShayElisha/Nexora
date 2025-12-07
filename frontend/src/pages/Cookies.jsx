import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";

const Cookies = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false
  });

  const cookieTypes = [
    {
      id: "necessary",
      icon: "🔒",
      title: "עוגיות הכרחיות",
      description: "עוגיות חיוניות לתפקוד המערכת. לא ניתן לבטל.",
      required: true
    },
    {
      id: "functional",
      icon: "⚙️",
      title: "עוגיות תפקודיות",
      description: "עוזרות לשמור העדפות ולשפר חוויית משתמש.",
      required: false
    },
    {
      id: "analytics",
      icon: "📊",
      title: "עוגיות אנליטיות",
      description: "עוזרות לנו להבין כיצד משתמשים במערכת ולשפר אותה.",
      required: false
    },
    {
      id: "marketing",
      icon: "📢",
      title: "עוגיות שיווקיות",
      description: "משמשות להצגת פרסומות רלוונטיות.",
      required: false
    }
  ];

  const handleToggle = (id) => {
    if (id !== "necessary") {
      setPreferences(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    alert('העדפות נשמרו בהצלחה!');
  };

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
            🍪
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white"
          >
            מדיניות עוגיות
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            שקיפות מלאה לגבי העוגיות שאנו משתמשים בהן ואיך הן עוזרות לנו
          </motion.p>
        </div>
      </section>

      {/* What are Cookies */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-xl shadow-lg"
            style={{
              backgroundColor: 'var(--bg-color)',
              border: '2px solid var(--border-color)'
            }}
          >
            <h2 
              className="text-3xl font-bold mb-4"
              style={{ color: 'var(--color-primary)' }}
            >
              מה הן עוגיות?
            </h2>
            <p 
              className="text-lg leading-relaxed mb-4"
              style={{ color: 'var(--text-color)', opacity: 0.9 }}
            >
              עוגיות הן קבצי טקסט קטנים שנשמרים במכשיר שלך כאשר אתה מבקר באתר.
              הן עוזרות לאתר "לזכור" אותך ואת ההעדפות שלך, ומשפרות את חוויית הגלישה.
            </p>
            <p 
              className="text-lg leading-relaxed"
              style={{ color: 'var(--text-color)', opacity: 0.9 }}
            >
              אנו משתמשים בעוגיות כדי לספק לך חוויה מותאמת אישית, להבין כיצד
              המערכת שלנו משמשת, ולשפר את השירות שלנו.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cookie Types and Preferences */}
      <section className="py-16">
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
            סוגי העוגיות והעדפות
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cookieTypes.map((cookie, index) => (
              <motion.div
                key={cookie.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-5xl">{cookie.icon}</div>
                    <div>
                      <h3 
                        className="text-xl font-bold mb-1"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {cookie.title}
                      </h3>
                      {cookie.required && (
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: 'var(--color-accent)',
                            color: 'white'
                          }}
                        >
                          חובה
                        </span>
                      )}
                    </div>
                  </div>
                  <label className="relative inline-block w-14 h-8">
                    <input
                      type="checkbox"
                      checked={preferences[cookie.id]}
                      onChange={() => handleToggle(cookie.id)}
                      disabled={cookie.required}
                      className="sr-only peer"
                    />
                    <div 
                      className={`w-14 h-8 rounded-full transition-all duration-300 ${
                        preferences[cookie.id] 
                          ? 'bg-primary' 
                          : 'bg-gray-300'
                      } ${cookie.required ? 'opacity-50' : 'cursor-pointer'}`}
                    >
                      <div 
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                          preferences[cookie.id] ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </label>
                </div>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {cookie.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Save Preferences Button */}
          <div className="text-center mt-12">
            <button
              onClick={handleSavePreferences}
              className="py-4 px-12 font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
              style={{
                background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                color: 'var(--button-text)'
              }}
            >
              שמור העדפות 💾
            </button>
          </div>
        </div>
      </section>

      {/* How to Manage */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            איך לנהל עוגיות בדפדפן?
          </h2>
          <p className="text-lg text-white mb-8" style={{ opacity: 0.9 }}>
            רוב הדפדפנים מאפשרים לך לשלוט בעוגיות דרך ההגדרות. ניתן לחסום,
            למחוק או לקבל התראות לפני שמירת עוגיות חדשות.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Chrome', 'Firefox', 'Safari', 'Edge'].map((browser) => (
              <div
                key={browser}
                className="px-6 py-3 rounded-xl font-semibold"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                {browser}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Cookies;

