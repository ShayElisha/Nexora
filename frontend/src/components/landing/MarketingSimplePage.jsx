import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const MarketingSimplePage = ({ pageKey }) => {
  const { t } = useTranslation();
  const base = `landing.pages.${pageKey}`;
  const paragraphs = t(`${base}.paragraphs`, { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(paragraphs) ? paragraphs : [t(`${base}.body`, { defaultValue: "" })].filter(Boolean);

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} />
      <LandingSection tight>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-3xl mx-auto ${landingCard} p-8 space-y-4`}
          style={cardStyle}
        >
          {list.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>
              {p}
            </p>
          ))}
        </motion.div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingSimplePage;
