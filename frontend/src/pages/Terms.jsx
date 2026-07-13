import { Link } from "react-router-dom";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicLegalSections from "../components/public/PublicLegalSections";
import { usePageLocale } from "../hooks/usePageLocale";

const Terms = () => {
  const { t } = usePageLocale();
  const sections = t("public.terms.sections", { returnObjects: true }) || [];

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.terms.badge")}
        title={t("public.terms.title")}
        subtitle={`${t("public.terms.lastUpdatedPrefix")} ${new Date().toLocaleDateString()}`}
      />

      <PublicLegalSections sections={sections} />

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
              {t("public.terms.contactTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.terms.contactSubtitle")}
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
              {t("public.terms.contactButton")}
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Terms;

