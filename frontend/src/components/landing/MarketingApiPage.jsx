import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection, { SectionHeading } from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const METHOD_COLORS = {
  GET: "#10B981",
  POST: "#3B82F6",
  PUT: "#F59E0B",
  DELETE: "#EF4444",
};

const MarketingApiPage = () => {
  const { t } = useTranslation();
  const base = "landing.pages.api";
  const endpoints = t(`${base}.endpoints`, { returnObjects: true, defaultValue: [] });
  const features = t(`${base}.features`, { returnObjects: true, defaultValue: [] });

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} badge="REST API v1" />
      <LandingSection>
        <SectionHeading title={t(`${base}.endpoints_title`)} />
        <div className="space-y-3 max-w-4xl mx-auto">
          {(Array.isArray(endpoints) ? endpoints : []).map((ep, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`${landingCard} flex flex-wrap items-center gap-3 font-mono text-sm`}
              style={cardStyle}
            >
              <span
                className="px-2 py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: METHOD_COLORS[ep.method] || "var(--color-primary)" }}
              >
                {ep.method}
              </span>
              <code style={{ color: "var(--text-color)" }}>{ep.path}</code>
              <span className="text-xs flex-1" style={{ color: "var(--color-secondary)" }}>
                {ep.description}
              </span>
            </motion.div>
          ))}
        </div>
      </LandingSection>
      <LandingSection alt>
        <SectionHeading title={t(`${base}.features_title`)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Array.isArray(features) ? features : []).map((f, index) => (
            <div key={index} className={`${landingCard} text-center`} style={cardStyle}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2" style={{ color: "var(--color-primary)" }}>{f.title}</h3>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{f.description}</p>
            </div>
          ))}
        </div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingApiPage;
