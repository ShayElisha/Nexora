import { useTranslation } from "react-i18next";
import LandingSection, { SectionHeading } from "../landing/LandingSection";

const TrustedByLogos = () => {
  const { t } = useTranslation();
  const logos = t("landing.trusted_by.logos", { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(logos) ? logos : [];

  return (
    <LandingSection alt tight>
      <SectionHeading title={t("landing.trusted_by.title")} />
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-70">
        {list.map((name, index) => (
          <div
            key={index}
            className="px-6 py-3 rounded-lg border text-sm font-bold tracking-wider uppercase"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--color-secondary)",
            }}
          >
            {name}
          </div>
        ))}
      </div>
    </LandingSection>
  );
};

export default TrustedByLogos;
