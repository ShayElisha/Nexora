import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Customers = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const testimonials = [
    {
      company: "טכנולוגיות מתקדמות בע\"מ",
      logo: "🚀",
      name: "דוד כהן",
      role: "מנכ\"ל",
      text: "Nexora שינתה לנו את המשחק. חסכנו 30% מהזמן בניהול היומיומי!",
      industry: "היי-טק",
      size: "150 עובדים"
    },
    {
      company: "רשת חנויות שלום",
      logo: "🏪",
      name: "שרה לוי",
      role: "בעלים",
      text: "סוף סוף מערכת שמבינה את הצרכים שלנו. ממליצה בחום!",
      industry: "קמעונאות",
      size: "80 עובדים"
    },
    {
      company: "בניה ופיתוח מודרני",
      logo: "🏗️",
      name: "מיכאל ברק",
      role: "סמנכ\"ל",
      text: "השליטה והשקיפות שקיבלנו חסרות תקדים. מעולה!",
      industry: "בנייה",
      size: "200 עובדים"
    },
    {
      company: "יועצים פיננסיים",
      logo: "💼",
      name: "רונית אבני",
      role: "שותפה",
      text: "מערכת אינטואיטיבית ותמיכה מצוינת. ממש מרוצים!",
      industry: "שירותים",
      size: "25 עובדים"
    }
  ];

  const stats = [
    { number: "1,200+", label: "לקוחות פעילים" },
    { number: "50,000+", label: "משתמשים יומיים" },
    { number: "99.9%", label: "שביעות רצון" },
    { number: "24/7", label: "תמיכה" }
  ];

  const industries = [
    { icon: "💻", name: "היי-טק", count: "250+" },
    { icon: "🏪", name: "קמעונאות", count: "180+" },
    { icon: "🏗️", name: "בנייה", count: "120+" },
    { icon: "🏥", name: "בריאות", count: "90+" },
    { icon: "🎓", name: "חינוך", count: "150+" },
    { icon: "💼", name: "שירותים", count: "200+" }
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
            הלקוחות שלנו
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            עסקים מובילים בוחרים ב-Nexora לניהול יומיומי
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
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
                <h3 
                  className="text-4xl font-bold mb-2"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {stat.number}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
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
            תעשיות שאנחנו משרתים
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg text-center hover:scale-105 transition-transform duration-300"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-5xl mb-3">{industry.icon}</div>
                <h3 
                  className="font-bold mb-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {industry.name}
                </h3>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--text-color)', opacity: 0.7 }}
                >
                  {industry.count} לקוחות
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
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
            מה הלקוחות אומרים
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-6xl">{testimonial.logo}</div>
                  <div>
                    <h3 
                      className="font-bold text-lg"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {testimonial.company}
                    </h3>
                    <div className="flex gap-2 text-xs mt-1">
                      <span 
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: 'var(--color-secondary)', color: 'white' }}
                      >
                        {testimonial.industry}
                      </span>
                      <span 
                        className="px-2 py-1 rounded"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
                      >
                        {testimonial.size}
                      </span>
                    </div>
                  </div>
                </div>
                <p 
                  className="text-lg mb-6 leading-relaxed"
                  style={{ color: 'var(--text-color)' }}
                >
                  "{testimonial.text}"
                </p>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: 'var(--color-accent)' }}>⭐</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">👤</div>
                  <div>
                    <p 
                      className="font-semibold"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {testimonial.name}
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--text-color)', opacity: 0.7 }}
                    >
                      {testimonial.role}
                    </p>
                  </div>
                </div>
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
            הצטרף ללקוחות המרוצים שלנו
          </h2>
          <p className="text-lg text-white mb-8" style={{ opacity: 0.9 }}>
            התחל את המסע שלך עם Nexora עוד היום
          </p>
          <button
            onClick={() => navigate('/create-company')}
            className="py-4 px-10 font-bold rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
            style={{
              backgroundColor: 'white',
              color: 'var(--color-primary)'
            }}
          >
            התחל עכשיו בחינם ✨
          </button>
        </div>
      </section>
    </div>
  );
};

export default Customers;

