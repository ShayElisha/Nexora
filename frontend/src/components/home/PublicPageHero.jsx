import { motion } from "framer-motion";
import { usePageLocale } from "../../hooks/usePageLocale";

const PublicPageHero = ({ title, subtitle, badge }) => {
  const { isRTL } = usePageLocale();

  return (
    <section
      className="pt-28 pb-16 md:pt-32 md:pb-20"
      style={{ background: `linear-gradient(180deg, var(--footer-bg) 0%, var(--bg-color) 100%)` }}
    >
      <div className={`max-w-4xl mx-auto px-6 text-center ${isRTL ? "text-right md:text-center" : ""}`}>
        {badge && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold tracking-widest uppercase mb-4"
            style={{ color: "var(--color-primary)" }}
          >
            {badge}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-3xl md:text-5xl font-black tracking-tight mb-5"
          style={{ color: "var(--text-color)" }}
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
            style={{ color: "var(--color-secondary)" }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default PublicPageHero;
