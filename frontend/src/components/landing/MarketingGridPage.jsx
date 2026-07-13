import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection, { SectionHeading } from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const MarketingGridPage = ({
  pageKey,
  columns = "md:grid-cols-2 lg:grid-cols-3",
  showBullets = false,
}) => {
  const { t } = useTranslation();
  const base = `landing.pages.${pageKey}`;
  const items = t(`${base}.items`, { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(items) ? items : [];

  return (
    <LandingPageShell>
      <LandingPageHero
        badge={t(`${base}.badge`, { defaultValue: "" })}
        title={t(`${base}.title`)}
        subtitle={t(`${base}.subtitle`)}
        icon={t(`${base}.icon`, { defaultValue: "" }) || undefined}
      />
      <LandingSection>
        {t(`${base}.section_title`, { defaultValue: "" }) && (
          <SectionHeading title={t(`${base}.section_title`)} subtitle={t(`${base}.section_subtitle`, { defaultValue: "" })} />
        )}
        <div className={`grid grid-cols-1 ${columns} gap-6 md:gap-8`}>
          {list.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`${landingCard} text-center md:text-start`}
              style={cardStyle}
            >
              {item.icon && <div className="text-4xl mb-4">{item.icon}</div>}
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-primary)" }}>
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-secondary)" }}>
                {item.description}
              </p>
              {showBullets && item.bullets?.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {item.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2" style={{ color: "var(--text-color)" }}>
                      <span style={{ color: "var(--color-primary)" }}>✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingGridPage;
