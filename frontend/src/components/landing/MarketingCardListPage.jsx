import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection, { SectionHeading } from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const MarketingCardListPage = ({ pageKey, columns = "md:grid-cols-2 lg:grid-cols-3" }) => {
  const { t } = useTranslation();
  const base = `landing.pages.${pageKey}`;
  const items = t(`${base}.items`, { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(items) ? items : [];

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} />
      <LandingSection>
        <div className={`grid grid-cols-1 ${columns} gap-6`}>
          {list.map((item, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`${landingCard}`}
              style={cardStyle}
            >
              {item.image && <div className="text-4xl mb-4">{item.image}</div>}
              {item.category && (
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                  {item.category}
                </span>
              )}
              <h3 className="text-lg font-bold mt-2 mb-2" style={{ color: "var(--text-color)" }}>
                {item.title}
              </h3>
              <p className="text-sm mb-3" style={{ color: "var(--color-secondary)" }}>
                {item.description || item.excerpt}
              </p>
              {item.date && (
                <p className="text-xs" style={{ color: "var(--color-secondary)", opacity: 0.8 }}>
                  {item.date}
                </p>
              )}
              {item.articles != null && (
                <p className="text-xs mt-2" style={{ color: "var(--color-primary)" }}>
                  {item.articles} {t("landing.pages.help.articles_label")}
                </p>
              )}
            </motion.article>
          ))}
        </div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingCardListPage;
