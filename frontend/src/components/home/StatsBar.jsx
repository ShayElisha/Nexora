import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LandingSection from "../landing/LandingSection";

const StatsBar = () => {
  const { t } = useTranslation();
  const stats = t("landing.stats.items", { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(stats) ? stats : [];

  return (
    <LandingSection alt tight>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {list.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="text-center"
          >
            <p className="text-3xl md:text-4xl font-black mb-1" style={{ color: "var(--color-primary)" }}>
              {stat.value}
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </LandingSection>
  );
};

export default StatsBar;
