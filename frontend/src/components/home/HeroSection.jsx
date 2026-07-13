import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import HeroWallVisual from "./HeroWallVisual";

const HeroSection = ({ onTrial, onExpert }) => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section
      className="relative pt-28 pb-20 md:pt-32 md:pb-28 overflow-hidden"
      style={{ backgroundColor: "var(--bg-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, var(--footer-bg), var(--bg-color))`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`space-y-8 ${isRTL ? "text-right" : "text-left"}`}
          >
            <p
              className="text-sm font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-primary)" }}
            >
              {t("landing.hero.badge")}
            </p>

            <h1
              className="text-4xl md:text-5xl lg:text-[3.25rem] font-black leading-[1.1] tracking-tight"
              style={{ color: "var(--text-color)" }}
            >
              {t("landing.hero.title")}
            </h1>

            <p
              className="text-lg md:text-xl leading-relaxed max-w-xl"
              style={{ color: "var(--color-secondary)" }}
            >
              {t("landing.hero.subtitle")}
            </p>

            <div className={`flex flex-wrap gap-4 ${isRTL ? "justify-end" : ""}`}>
              <button
                onClick={onTrial}
                className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-lg hover:-translate-y-0.5 transition-all duration-300"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
              >
                {t("landing.hero.cta_trial")}
                <Arrow size={16} className={`${isRTL ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"} transition-transform`} />
              </button>
              <button
                onClick={onExpert}
                className="px-7 py-3.5 text-sm font-semibold border rounded-lg hover:-translate-y-0.5 transition-all duration-300"
                style={{
                  color: "var(--text-color)",
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                {t("landing.hero.cta_expert")}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroWallVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
