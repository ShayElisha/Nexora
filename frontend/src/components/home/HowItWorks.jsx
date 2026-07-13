import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LandingSection, { SectionHeading } from "../landing/LandingSection";
import { landingCard, cardStyle } from "../landing/landingStyles";

const HowItWorks = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const steps = t("landing.how_it_works.steps", { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(steps) ? steps : [];

  return (
    <LandingSection>
      <SectionHeading
        title={t("landing.how_it_works.title")}
        subtitle={t("landing.how_it_works.subtitle")}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {list.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`${landingCard} relative`}
            style={cardStyle}
          >
            <span
              className="absolute -top-3 text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
                [isRTL ? "right" : "left"]: "1.5rem",
              }}
            >
              {index + 1}
            </span>
            <div className="text-3xl mb-4 mt-2">{step.icon}</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-color)" }}>
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </LandingSection>
  );
};

export default HowItWorks;
