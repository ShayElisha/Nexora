import { Building2, Briefcase, GraduationCap, Handshake, Target, TrendingUp, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicCardGrid from "../components/public/PublicCardGrid";
import { usePageLocale } from "../hooks/usePageLocale";

const partnerTypeIcons = [Handshake, Briefcase, GraduationCap];
const partnerBenefitIcons = [TrendingUp, Target, Wrench, Handshake];

const Partners = () => {
  const { t } = usePageLocale();
  const partnerTypes = t("public.partners.types", { returnObjects: true }) || [];
  const benefits = t("public.partners.benefits", { returnObjects: true }) || [];
  const currentPartners = t("public.partners.currentPartners", { returnObjects: true }) || [];

  const partnerTypeCards = partnerTypes.map((item, index) => ({
    ...item,
    icon: partnerTypeIcons[index % partnerTypeIcons.length],
    bullets: item.bullets,
  }));

  const partnerBenefitCards = benefits.map((item, index) => ({
    ...item,
    icon: partnerBenefitIcons[index % partnerBenefitIcons.length],
  }));

  return (
    <PublicPageLayout>
      <PublicPageHero badge={t("public.partners.badge")} title={t("public.partners.title")} subtitle={t("public.partners.subtitle")} />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: "var(--text-color)" }}>
            {t("public.partners.typesTitle")}
          </h2>
          <PublicCardGrid items={partnerTypeCards} columns={3} />
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: "var(--text-color)" }}>
            {t("public.partners.benefitsTitle")}
          </h2>
          <PublicCardGrid items={partnerBenefitCards} columns={4} />
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: "var(--text-color)" }}>
            {t("public.partners.currentPartnersTitle")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {currentPartners.map((partner) => (
              <div
                key={partner.name}
                className="p-4 rounded-xl border text-center"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <Building2 size={20} className="mx-auto mb-2" style={{ color: "var(--color-primary)" }} />
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text-color)" }}>
                  {partner.name}
                </h3>
                <p className="text-xs" style={{ color: "var(--color-secondary)" }}>
                  {partner.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            className="rounded-2xl border p-8 md:p-10"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "var(--text-color)" }}>
              {t("public.partners.ctaTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.partners.ctaSubtitle")}
            </p>
            <Link
              to="/contact"
              className="inline-flex py-3 px-7 rounded-xl font-semibold border"
              style={{
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              {t("public.partners.ctaButton")}
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Partners;

