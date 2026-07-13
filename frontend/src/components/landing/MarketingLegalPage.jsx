import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const MarketingLegalPage = ({ pageKey }) => {
  const { t } = useTranslation();
  const base = `landing.pages.${pageKey}`;
  const sections = t(`${base}.sections`, { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(sections) ? sections : [];

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} />
      <LandingSection tight>
        <div className="max-w-3xl mx-auto space-y-6">
          {list.map((section, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className={`${landingCard}`}
              style={cardStyle}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-primary)" }}>
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>
                {section.content}
              </p>
            </motion.article>
          ))}
        </div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingLegalPage;
