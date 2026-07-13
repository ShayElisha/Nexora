import { motion } from "framer-motion";
import { Headphones, LineChart, Shield, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

const ValuePillars = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const pillars = [
    { icon: Headphones, titleKey: "landing.values.support_title", descKey: "landing.values.support_desc" },
    { icon: LineChart, titleKey: "landing.values.analytics_title", descKey: "landing.values.analytics_desc" },
    { icon: Shield, titleKey: "landing.values.security_title", descKey: "landing.values.security_desc" },
    { icon: Zap, titleKey: "landing.values.deploy_title", descKey: "landing.values.deploy_desc" },
  ];

  return (
    <section
      className="relative py-24 landing-grid-bg overflow-hidden"
      style={{ backgroundColor: "var(--bg-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight"
          style={{ color: "var(--text-color)" }}
        >
          {t("landing.values.title")}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item, index) => (
            <motion.div
              key={item.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className={`p-8 border rounded-2xl hover:shadow-lg transition-all duration-300 ${
                isRTL ? "text-right" : "text-left"
              }`}
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl border flex items-center justify-center mb-6"
                style={{ borderColor: "var(--border-color)" }}
              >
                <item.icon size={20} strokeWidth={1.5} style={{ color: "var(--color-primary)" }} />
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-color)" }}>
                {t(item.titleKey)}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>
                {t(item.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePillars;
