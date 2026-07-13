import { motion } from "framer-motion";

const LandingPageHero = ({ title, subtitle, badge, icon }) => (
  <section
    className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden"
    style={{ backgroundColor: "var(--bg-color)" }}
  >
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: "linear-gradient(to bottom, var(--footer-bg), var(--bg-color))",
      }}
    />
    <div className="max-w-7xl mx-auto px-6 relative text-center">
      {icon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-6xl mb-6"
        >
          {icon}
        </motion.div>
      )}
      {badge && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          {badge}
        </motion.p>
      )}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-4xl md:text-5xl font-black tracking-tight mb-5"
        style={{ color: "var(--text-color)" }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          style={{ color: "var(--color-secondary)" }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  </section>
);

export default LandingPageHero;
