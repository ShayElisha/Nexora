import { Gauge, ShieldCheck, Webhook, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicCardGrid from "../components/public/PublicCardGrid";
import { usePageLocale } from "../hooks/usePageLocale";

const apiFeatureIcons = [ShieldCheck, Zap, Gauge, Webhook];

const API = () => {
  const { t } = usePageLocale();
  const features = t("public.api.features", { returnObjects: true }) || [];
  const endpoints = t("public.api.endpoints", { returnObjects: true }) || [];
  const featureCards = features.map((item, index) => ({
    ...item,
    icon: apiFeatureIcons[index % apiFeatureIcons.length],
  }));

  return (
    <PublicPageLayout>
      <PublicPageHero badge={t("public.api.badge")} title={t("public.api.title")} subtitle={t("public.api.subtitle")} />

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <PublicCardGrid items={featureCards} columns={4} />
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.api.endpointsTitle")}
          </h2>
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <div
                key={`${endpoint.method}-${endpoint.endpoint}`}
                className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center gap-4"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <span
                  className="px-3 py-1 rounded-lg text-xs font-bold border w-fit"
                  style={{
                    borderColor: "var(--color-primary)",
                    color: "var(--color-primary)",
                  }}
                >
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono" style={{ color: "var(--text-color)" }}>
                  {endpoint.endpoint}
                </code>
                <p className="text-sm md:ml-auto" style={{ color: "var(--color-secondary)" }}>
                  {endpoint.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.api.codeTitle")}
          </h2>
          <div
            className="rounded-xl p-6 overflow-x-auto border"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
            }}
          >
            <pre className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-color)" }}>
              {t("public.api.codeExample")}
            </pre>
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
              {t("public.api.ctaTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.api.ctaSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/docs"
                className="py-3 px-6 rounded-xl font-semibold border"
                style={{
                  borderColor: "var(--color-primary)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--button-text)",
                }}
              >
                {t("public.api.ctaPrimary")}
              </Link>
              <Link
                to="/contact"
                className="py-3 px-6 rounded-xl font-semibold border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                {t("public.api.ctaSecondary")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default API;

