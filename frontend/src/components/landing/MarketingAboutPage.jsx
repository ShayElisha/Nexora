import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection, { SectionHeading } from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const MarketingAboutPage = () => {
  const { t } = useTranslation();
  const base = "landing.pages.about";
  const values = t(`${base}.values`, { returnObjects: true, defaultValue: [] });
  const team = t(`${base}.team`, { returnObjects: true, defaultValue: [] });

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} />
      <LandingSection>
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <SectionHeading title={t(`${base}.story_title`)} />
          <p className="text-base leading-relaxed" style={{ color: "var(--color-secondary)" }}>
            {t(`${base}.story_p1`)}
          </p>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-secondary)" }}>
            {t(`${base}.story_p2`)}
          </p>
        </div>
      </LandingSection>
      <LandingSection alt>
        <SectionHeading title={t(`${base}.values_title`)} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Array.isArray(values) ? values : []).map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`${landingCard} text-center`}
              style={cardStyle}
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold mb-2" style={{ color: "var(--color-primary)" }}>{item.title}</h3>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </LandingSection>
      <LandingSection>
        <SectionHeading title={t(`${base}.team_title`)} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Array.isArray(team) ? team : []).map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`${landingCard} text-center`}
              style={cardStyle}
            >
              <div className="text-5xl mb-3">{member.avatar}</div>
              <h3 className="font-bold" style={{ color: "var(--color-primary)" }}>{member.name}</h3>
              <p className="text-sm mb-2" style={{ color: "var(--color-secondary)" }}>{member.role}</p>
              <p className="text-sm" style={{ color: "var(--text-color)", opacity: 0.85 }}>{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingAboutPage;
