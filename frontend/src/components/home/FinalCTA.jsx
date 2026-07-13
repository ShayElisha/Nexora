import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const FinalCTA = ({ onSignUp, onLogin }) => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  return (
    <section className="py-24" style={{ backgroundColor: "var(--bg-color)" }} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: "var(--text-color)" }}
        >
          {t("landing.cta.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg mb-10 max-w-2xl mx-auto"
          style={{ color: "var(--color-secondary)" }}
        >
          {t("landing.cta.subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <button
            onClick={onSignUp}
            className="px-10 py-4 text-sm font-semibold rounded-lg hover:-translate-y-0.5 transition-all duration-300"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
          >
            {t("landing.cta.try")}
          </button>
          <button
            onClick={onLogin}
            className="px-10 py-4 text-sm font-semibold border rounded-lg hover:-translate-y-0.5 transition-all duration-300"
            style={{
              color: "var(--text-color)",
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
            }}
          >
            {t("landing.cta.login")}
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
