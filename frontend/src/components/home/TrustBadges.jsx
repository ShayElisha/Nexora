import { useTranslation } from "react-i18next";
import { Shield, Lock, Award, FileCheck } from "lucide-react";
import LandingSection, { SectionHeading } from "../landing/LandingSection";
import { landingCard, cardStyle } from "../landing/landingStyles";

const BADGE_ICONS = [Shield, Lock, Award, FileCheck];

const TrustBadges = () => {
  const { t } = useTranslation();
  const badges = t("landing.trust.items", { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(badges) ? badges : [];

  return (
    <LandingSection>
      <SectionHeading
        title={t("landing.trust.title")}
        subtitle={t("landing.trust.subtitle")}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {list.map((badge, index) => {
          const Icon = BADGE_ICONS[index % BADGE_ICONS.length];
          return (
            <div
              key={index}
              className={`${landingCard} flex flex-col items-center text-center gap-3 py-8`}
              style={cardStyle}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
              >
                <Icon size={22} style={{ color: "var(--color-primary)" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: "var(--text-color)" }}>
                {badge.title}
              </h3>
              <p className="text-xs" style={{ color: "var(--color-secondary)" }}>
                {badge.description}
              </p>
            </div>
          );
        })}
      </div>
    </LandingSection>
  );
};

export default TrustBadges;
