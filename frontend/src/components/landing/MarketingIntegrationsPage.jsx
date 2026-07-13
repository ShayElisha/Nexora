import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection, { SectionHeading } from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const MarketingIntegrationsPage = () => {
  const { t } = useTranslation();
  const base = "landing.pages.integrations";
  const categories = t(`${base}.categories`, { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(categories) ? categories : [];

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} icon="🔗" />
      <LandingSection>
        <div className="space-y-12">
          {list.map((category, ci) => (
            <div key={ci}>
              <SectionHeading title={category.name} centered={false} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(category.tools || []).map((tool, ti) => (
                  <motion.div
                    key={ti}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`${landingCard} text-center`}
                    style={cardStyle}
                  >
                    <div className="text-3xl mb-2">{tool.icon}</div>
                    <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--text-color)" }}>
                      {tool.name}
                    </h4>
                    <p className="text-xs" style={{ color: "var(--color-secondary)" }}>
                      {tool.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingIntegrationsPage;
