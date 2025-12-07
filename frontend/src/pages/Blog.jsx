import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Blog = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const posts = [
    {
      title: "5 דרכים לשפר את היעילות העסקית ב-2024",
      excerpt: "גלה את האסטרטגיות המובילות לשיפור הפרודוקטיביות וההצלחה העסקית",
      date: "15 ינואר 2024",
      category: "טיפים",
      image: "📈"
    },
    {
      title: "מדריך מלא לניהול מלאי חכם",
      excerpt: "כל מה שצריך לדעת על ניהול מלאי אפקטיבי שחוסך זמן וכסף",
      date: "10 ינואר 2024",
      category: "מדריכים",
      image: "📦"
    },
    {
      title: "אבטחת מידע בעולם העסקי המודרני",
      excerpt: "איך להגן על המידע העסקי שלך מאיומי סייבר",
      date: "5 ינואר 2024",
      category: "אבטחה",
      image: "🔒"
    },
    {
      title: "אוטומציה בעסקים: המהפכה הבאה",
      excerpt: "איך אוטומציה יכולה לחסוך שעות עבודה ולהגדיל רווחים",
      date: "28 דצמבר 2023",
      category: "חדשנות",
      image: "🤖"
    },
    {
      title: "ניהול פיננסי נכון: 7 כללי זהב",
      excerpt: "עקרונות יסוד לניהול כספי בריא ויציב בעסק שלך",
      date: "20 דצמבר 2023",
      category: "פיננסים",
      image: "💰"
    },
    {
      title: "בניית צוות מנצח: המדריך המלא",
      excerpt: "כיצד לגייס, לפתח ולשמר עובדים מעולים",
      date: "15 דצמבר 2023",
      category: "משאבי אנוש",
      image: "👥"
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
            הבלוג של Nexora
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white"
            style={{ opacity: 0.9 }}
          >
            תובנות, טיפים ומדריכים לניהול עסקי מוצלח
          </motion.p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div 
                  className="h-48 flex items-center justify-center text-8xl"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
                  }}
                >
                  {post.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span 
                      className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{
                        backgroundColor: 'var(--color-accent)',
                        color: 'white'
                      }}
                    >
                      {post.category}
                    </span>
                    <span 
                      className="text-xs"
                      style={{ color: 'var(--text-color)', opacity: 0.7 }}
                    >
                      {post.date}
                    </span>
                  </div>
                  <h3 
                    className="text-xl font-bold mb-3"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {post.title}
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-color)', opacity: 0.8 }}
                  >
                    {post.excerpt}
                  </p>
                  <button 
                    className="mt-4 text-sm font-semibold transition-all duration-300"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    קרא עוד →
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;

