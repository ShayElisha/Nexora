import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CheckCircle, AlertCircle } from "lucide-react";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection, { SectionHeading } from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const statusColor = {
  operational: "var(--color-primary)",
  degraded: "#F59E0B",
  outage: "#EF4444",
};

const MarketingStatusPage = () => {
  const { t } = useTranslation();
  const base = "landing.pages.status";
  const services = t(`${base}.services`, { returnObjects: true, defaultValue: [] });
  const incidents = t(`${base}.incidents`, { returnObjects: true, defaultValue: [] });

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} />
      <LandingSection>
        <div
          className={`${landingCard} flex items-center gap-3 mb-8 p-4`}
          style={cardStyle}
        >
          <CheckCircle size={22} style={{ color: "var(--color-primary)" }} />
          <span className="font-semibold" style={{ color: "var(--text-color)" }}>
            {t(`${base}.all_operational`)}
          </span>
        </div>
        <div className="space-y-3">
          {(Array.isArray(services) ? services : []).map((svc, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`${landingCard} flex flex-wrap items-center justify-between gap-4`}
              style={cardStyle}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: statusColor[svc.status] || statusColor.operational }}
                />
                <span className="font-medium" style={{ color: "var(--text-color)" }}>{svc.name}</span>
              </div>
              <div className="flex gap-6 text-sm" style={{ color: "var(--color-secondary)" }}>
                <span>{t(`${base}.uptime`)}: {svc.uptime}</span>
                <span>{t(`${base}.response`)}: {svc.response}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </LandingSection>
      {Array.isArray(incidents) && incidents.length > 0 && (
        <LandingSection alt>
          <SectionHeading title={t(`${base}.incidents_title`)} />
          <div className="space-y-4 max-w-3xl mx-auto">
            {incidents.map((inc, index) => (
              <div key={index} className={`${landingCard} flex gap-3`} style={cardStyle}>
                <AlertCircle size={20} style={{ color: "var(--color-secondary)", flexShrink: 0 }} />
                <div>
                  <p className="font-medium text-sm" style={{ color: "var(--text-color)" }}>{inc.title}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-secondary)" }}>{inc.date}</p>
                </div>
              </div>
            ))}
          </div>
        </LandingSection>
      )}
    </LandingPageShell>
  );
};

export default MarketingStatusPage;
