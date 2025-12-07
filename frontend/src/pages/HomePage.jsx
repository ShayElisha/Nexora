import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const HomePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const handleSignUp = () => {
    navigate("/create-company");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  // Typing effect for the tagline
  const [tagline, setTagline] = useState("");
  const fullTagline = "ניהול חכם לעסק שלך";

  useEffect(() => {
    let i = 0;
    const type = () => {
      if (i < fullTagline.length) {
        setTagline(fullTagline.slice(0, i + 1));
        i++;
        setTimeout(type, 100);
      }
    };
    type();
    return () => clearTimeout(type);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl"
            style={{ 
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              opacity: 0.2
            }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-20 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ 
              background: `linear-gradient(135deg, var(--color-accent), var(--color-primary))`,
              opacity: 0.2
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -50, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Text Content with Background */}
        <div className={`z-30 w-full md:w-1/2 flex items-center ${isRTL ? 'justify-end pr-8 md:pr-20' : 'justify-start pl-8 md:pl-20'}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className={`max-w-xl ${isRTL ? 'text-right' : 'text-left'} space-y-8 p-8 md:p-12 rounded-3xl backdrop-blur-md shadow-2xl`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white drop-shadow-2xl"
            >
              ממשק ERP יוקרתי לעסק המודרני
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl font-medium"
              style={{ 
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {tagline}{" "}
              <span 
                className="animate-blink"
                style={{ 
                  background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >|</span>
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base md:text-lg text-white"
              style={{ 
                opacity: 0.95,
                textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
              }}
            >
              פלטפורמה חכמה לניהול עובדים, לקוחות ותהליכים – הכול במקום אחד.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex gap-4 mt-6"
            >
              <button
                onClick={handleSignUp}
                className="py-3 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform"
                style={{
                  background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                  color: 'var(--button-text)'
                }}
              >
                התחלה מהירה ✨
              </button>
              <button
                onClick={handleLogin}
                className="py-3 px-8 font-semibold rounded-xl transition-all duration-300 hover:scale-105 transform backdrop-blur-sm"
                style={{
                  border: `2px solid white`,
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.color = 'black';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = 'white';
                }}
              >
                גלה עוד →
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-10">
          <video
            className="w-full h-full object-cover"
            src="/assets/vid.MP4"
            autoPlay
            loop
            muted
            playsInline
            poster="/assets/fallback-image.jpg"
          />
          <div 
            className="absolute inset-0 z-20"
            style={{
              background: isRTL 
                ? `linear-gradient(to left, rgba(0,0,0,0.3), transparent 50%, rgba(0,0,0,0.7))`
                : `linear-gradient(to right, rgba(0,0,0,0.3), transparent 50%, rgba(0,0,0,0.7))`
            }}
          />
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section 
        className="py-24 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-full h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, var(--color-accent) 35px, var(--color-accent) 70px)`
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-16"
            style={{ color: 'var(--button-text)' }}
          >
            למה לבחור ב-Nexora?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "🚀",
                title: "התחלה מהירה",
                description: "התקנה והטמעה ב-24 שעות בלבד"
              },
              {
                icon: "🔒",
                title: "אבטחה מלאה",
                description: "הצפנה ברמת בנקאות + גיבויים יומיים"
              },
              {
                icon: "📊",
                title: "דוחות חכמים",
                description: "תובנות עסקיות בזמן אמת"
              },
              {
                icon: "💪",
                title: "תמיכה 24/7",
                description: "צוות מקצועי זמין תמיד"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div className="text-6xl mb-4">{item.icon}</div>
                <h3 
                  className="text-xl font-bold mb-3"
                  style={{ color: 'var(--button-text)' }}
                >
                  {item.title}
                </h3>
                <p style={{ color: 'var(--button-text)', opacity: 0.9 }}>
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute top-0 left-0 w-72 h-72 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          <div 
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            נהל את העסק שלך בסטייל
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16 max-w-3xl mx-auto text-lg"
            style={{ color: 'var(--text-color)', opacity: 0.8 }}
          >
            כל הכלים הדרושים לניהול מתקדם של העסק – עובדים, לקוחות, מלאי ורכש.
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "ניהול עובדים",
                description:
                  "מעקב אחר ביצועים, שעות עבודה ומשמרות. נהל את צוות העובדים שלך ביעילות מרבית.",
                image:
                  "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
              },
              {
                title: "רכש והזמנות",
                description:
                  "אוטומציה של תהליכי רכש, מעקב אחר הזמנות וניהול מלאי חכם לעסק שלך.",
                image:
                  "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
              },
              {
                title: "ניהול לקוחות",
                description:
                  "CRM מובנה לשירות טוב יותר, מעקב אחר לקוחות ושיפור תקשורת וחווית לקוח.",
                image:
                  "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="relative overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 
                    className="text-xl font-bold mb-3"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ color: 'var(--text-color)', opacity: 0.8 }}>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section 
        className="py-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, var(--color-accent) 1px, transparent 1px),
                               radial-gradient(circle at 80% 80%, var(--color-accent) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-8">
            {[
              { number: "85%", label: "שיפור ביעילות" },
              { number: "1,200+", label: "לקוחות מרוצים" },
              { number: "24/7", label: "שירות מסביב לשעון" },
              { number: "99.9%", label: "זמינות מערכת" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="p-6 rounded-2xl backdrop-blur-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <p 
                  className="text-4xl md:text-5xl font-extrabold mb-2"
                  style={{ color: 'var(--button-text)' }}
                >
                  {item.number}
                </p>
                <p 
                  className="text-sm md:text-base font-medium"
                  style={{ color: 'var(--button-text)', opacity: 0.9 }}
                >
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section 
        className="py-20 text-center relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`,
            opacity: 0.05
          }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-accent))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            מוכן לשדרג את העסק שלך?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--text-color)', opacity: 0.8 }}
          >
            הצטרף לעסקים שכבר נהנים מפתרון ERP שמגדיל רווחיות ומשפר שליטה.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <button
              onClick={handleSignUp}
              className="py-4 px-10 font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              style={{
                background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                color: 'var(--button-text)'
              }}
            >
              נסה עכשיו ✨
            </button>
            <button
              onClick={handleLogin}
              className="py-4 px-10 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
              style={{
                border: `2px solid var(--color-primary)`,
                color: 'var(--color-primary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--color-primary)';
                e.target.style.color = 'var(--button-text)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--color-primary)';
              }}
            >
              התחבר →
            </button>
          </motion.div>
        </div>

        {/* Bottom decorative gradient */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`
          }}
        />
      </section>

      {/* Testimonials Section */}
      <section 
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            מה הלקוחות שלנו אומרים
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16 text-lg"
            style={{ color: 'var(--text-color)', opacity: 0.8 }}
          >
            עסקים מובילים בוחרים ב-Nexora
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "דוד כהן",
                role: "מנכ\"ל, חברת טכנולוגיה",
                avatar: "👨‍💼",
                text: "Nexora שינתה לנו את המשחק! ניהול העובדים והפרויקטים הפך להיות פשוט ויעיל פי 3."
              },
              {
                name: "שרה לוי",
                role: "סמנכ\"לית כספים",
                avatar: "👩‍💼",
                text: "הדוחות הפיננסיים והתובנות שאני מקבלת בזמן אמת חוסכות לי שעות עבודה כל יום."
              },
              {
                name: "מיכאל ברק",
                role: "מנהל תפעול",
                avatar: "👨‍🔧",
                text: "מערכת אינטואיטיבית, תמיכה מעולה וחיסכון אמיתי בעלויות. ממליץ בחום!"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl">{testimonial.avatar}</div>
                  <div>
                    <h4 
                      className="font-bold text-lg"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {testimonial.name}
                    </h4>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--text-color)', opacity: 0.7 }}
                    >
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p 
                  className="text-base leading-relaxed"
                  style={{ color: 'var(--text-color)' }}
                >
                  "{testimonial.text}"
                </p>
                <div className="mt-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: 'var(--color-accent)' }}>⭐</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section 
        className="py-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold mb-6"
            style={{ color: 'var(--button-text)' }}
          >
            משתלב עם הכלים שאתה כבר משתמש בהם
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg mb-12"
            style={{ color: 'var(--button-text)', opacity: 0.9 }}
          >
            אינטגרציות חכמות עם מערכות הליבה שלך
          </motion.p>

          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              "Excel", "Google Workspace", "Slack", "Teams", 
              "Salesforce", "QuickBooks", "Zoom", "Dropbox"
            ].map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="px-8 py-4 rounded-xl font-semibold text-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'var(--button-text)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {tool}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
