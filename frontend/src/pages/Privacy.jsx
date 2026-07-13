import { Ban, Database, Edit3, Eye, Hand, Trash2 } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicLegalSections from "../components/public/PublicLegalSections";
import { usePageLocale } from "../hooks/usePageLocale";

const rightsIcons = [Eye, Edit3, Trash2, Hand, Database, Ban];

const Privacy = () => {
  const { t } = usePageLocale();
  const sections = t("public.privacy.sections", { returnObjects: true }) || [];
  const rights = t("public.privacy.rights", { returnObjects: true }) || [];

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.privacy.badge")}
        title={t("public.privacy.title")}
        subtitle={`${t("public.privacy.lastUpdatedPrefix")} ${new Date().toLocaleDateString()}`}
      />

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.privacy.rightsTitle")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {rights.map((right, index) => {
              const Icon = rightsIcons[index % rightsIcons.length];
              return (
                <div
                  key={right}
                  className="p-4 rounded-xl border text-center"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                >
                  <Icon size={18} className="mx-auto mb-2" style={{ color: "var(--color-primary)" }} />
                  <p className="text-xs font-semibold" style={{ color: "var(--text-color)" }}>
                    {right}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
              {t("public.privacy.contactTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.privacy.contactSubtitle")}
            </p>
            <a
              href={`mailto:${t("public.privacy.contactEmail")}`}
              className="inline-flex py-3 px-7 rounded-xl font-semibold border"
              style={{
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              {t("public.privacy.contactEmail")}
            </a>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Privacy;

