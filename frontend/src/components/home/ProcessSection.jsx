import { motion } from "framer-motion";
import { usePageLocale } from "../../hooks/usePageLocale";

const STEPS = ["step1", "step2", "step3", "step4"];

const ProcessSection = () => {
  const { t, isRTL } = usePageLocale();

  return (
    <section className="py-24" style={{ backgroundColor: "var(--bg-color)" }} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-color)" }}>
            {t("landing.process.title")}
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: "var(--color-secondary)" }}>
            {t("landing.process.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 border rounded-2xl ${isRTL ? "text-right" : "text-left"}`}
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--footer-bg)" }}
            >
              <span
                className="inline-flex w-10 h-10 rounded-full items-center justify-center text-sm font-black mb-5"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
              >
                {index + 1}
              </span>
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-color)" }}>
                {t(`landing.process.${step}_title`)}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>
                {t(`landing.process.${step}_desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
