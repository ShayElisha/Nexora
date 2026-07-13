import { Cloud, CreditCard, LineChart, Megaphone, MessageSquare, Puzzle, TableProperties } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicCardGrid from "../components/public/PublicCardGrid";
import { usePageLocale } from "../hooks/usePageLocale";

const integrationIcons = [MessageSquare, TableProperties, Cloud, CreditCard, Megaphone, LineChart, Puzzle];

const Integrations = () => {
  const { t } = usePageLocale();
  const items = t("public.integrations.items", { returnObjects: true }) || [];
  const cards = items.map((item, index) => ({
    ...item,
    icon: integrationIcons[index % integrationIcons.length],
  }));

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.integrations.badge")}
        title={t("public.integrations.title")}
        subtitle={t("public.integrations.subtitle")}
      />

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <PublicCardGrid items={cards} columns={3} />
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
              {t("public.integrations.apiTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.integrations.apiDescription")}
            </p>
            <Link
              to="/docs"
              className="inline-flex items-center justify-center py-3 px-7 rounded-xl font-semibold border"
              style={{
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              {t("public.integrations.apiButton")}
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Integrations;

