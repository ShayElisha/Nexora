import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const About = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const values = [
    {
      icon: "🎯",
      title: "חדשנות",
      description: "אנחנו תמיד בחזית הטכנולוגיה, מביאים לך את הפתרונות המתקדמים ביותר"
    },
    {
      icon: "🤝",
      title: "שותפות",
      description: "ההצלחה שלך היא ההצלחה שלנו. אנחנו כאן בשבילך בכל שלב"
    },
    {
      icon: "💡",
      title: "פשטות",
      description: "טכנולוגיה מורכבת בממשק פשוט ואינטואיטיבי"
    },
    {
      icon: "🔒",
      title: "אמינות",
      description: "המידע שלך מוגן אצלנו כמו אוצר - זמינות 99.9%"
    }
  ];

  const team = [
    {
      name: "דוד כהן",
      role: "מייסד ומנכ\"ל",
      avatar: "👨‍💼",
      bio: "15 שנות ניסיון בפיתוח מערכות ERP"
    },
    {
      name: "שרה לוי",
      role: "סמנכ\"לית טכנולוגיות",
      avatar: "👩‍💻",
      bio: "מומחית בארכיטקטורת ענן ואבטחה"
    },
    {
      name: "מיכאל ברק",
      role: "מנהל מוצר",
      avatar: "👨‍🔧",
      bio: "מוביל בתחום חווית משתמש UX"
    },
    {
      name: "רונית אבני",
      role: "מנהלת שירות לקוחות",
      avatar: "👩‍💼",
      bio: "דואגת שכל לקוח מרגיש בבית"
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
            אודות Nexora
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            משנים את הדרך שבה עסקים מנהלים את עצמם
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-6"
          >
            <h2 
              className="text-3xl md:text-4xl font-bold mb-8"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              הסיפור שלנו
            </h2>
            <p 
              className="text-lg leading-relaxed"
              style={{ color: 'var(--text-color)', opacity: 0.9 }}
            >
              Nexora נוסדה בשנת 2020 מתוך חזון ברור: להפוך את ניהול העסקים לפשוט, יעיל ונגיש לכולם.
              ראינו שעסקים קטנים ובינוניים נאבקים עם מערכות מורכבות ויקרות, ושמנו לעצמנו מטרה
              ליצור פתרון שונה - מערכת ERP מקצועית שגם קלה לשימוש וגם משתלמת.
            </p>
            <p 
              className="text-lg leading-relaxed"
              style={{ color: 'var(--text-color)', opacity: 0.9 }}
            >
              היום, יותר מ-1,200 עסקים ברחבי הארץ סומכים עלינו לניהול היום-יום שלהם. אנחנו גאים
              להיות חלק מהצלחתם ומחויבים להמשיך לפתח ולשפר את המוצר שלנו.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section 
        className="py-20"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            הערכים שלנו
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
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
                <div className="text-6xl mb-4">{value.icon}</div>
                <h3 
                  className="text-xl font-bold mb-3"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {value.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            הצוות שלנו
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all duration-300"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="text-7xl mb-4">{member.avatar}</div>
                <h3 
                  className="text-lg font-bold mb-1"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {member.name}
                </h3>
                <p 
                  className="text-sm mb-3"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {member.role}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-color)', opacity: 0.8 }}
                >
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

