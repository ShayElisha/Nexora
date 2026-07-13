import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const INTEGRATIONS = [
  "Excel", "Google Workspace", "Slack", "Teams",
  "Salesforce", "QuickBooks", "Zoom", "Dropbox",
];

const IntegrationsBar = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  return (
    <section
      className="py-20 border-t"
      style={{ backgroundColor: "var(--footer-bg)", borderColor: "var(--border-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: "var(--text-color)" }}
        >
          {t("landing.integrations.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-12"
          style={{ color: "var(--color-secondary)" }}
        >
          {t("landing.integrations.subtitle")}
        </motion.p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {INTEGRATIONS.map((tool, index) => (
            <motion.div
              key={tool}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="px-4 py-3 rounded-xl text-sm font-medium border transition-colors duration-200"
              style={{
                color: "var(--text-color)",
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
              }}
            >
              {tool}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsBar;
