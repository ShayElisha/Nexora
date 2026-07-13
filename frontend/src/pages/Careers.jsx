import { BookOpen, Car, Dumbbell, House, PartyPopper, Utensils, Wallet } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicCardGrid from "../components/public/PublicCardGrid";
import { usePageLocale } from "../hooks/usePageLocale";

const benefitIcons = [Wallet, PartyPopper, House, BookOpen, Utensils, PartyPopper, Dumbbell, Car];

const Careers = () => {
  const { t } = usePageLocale();
  const benefits = t("public.careers.benefits", { returnObjects: true }) || [];
  const positions = t("public.careers.positions", { returnObjects: true }) || [];

  const benefitCards = benefits.map((benefit, index) => ({
    ...benefit,
    icon: benefitIcons[index % benefitIcons.length],
  }));

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.careers.badge")}
        title={t("public.careers.title")}
        subtitle={t("public.careers.subtitle")}
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: "var(--text-color)" }}>
            {t("public.careers.benefitsTitle")}
          </h2>
          <PublicCardGrid items={benefitCards} columns={4} />
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: "var(--text-color)" }}>
            {t("public.careers.positionsTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {positions.map((position) => (
              <div
                key={`${position.title}-${position.location}`}
                className="p-6 rounded-2xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text-color)" }}>
                  {position.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className="text-xs px-3 py-1 rounded-full border"
                    style={{
                      borderColor: "var(--color-primary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {position.department}
                  </span>
                  <span
                    className="text-xs px-3 py-1 rounded-full border"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    {position.location}
                  </span>
                  <span
                    className="text-xs px-3 py-1 rounded-full border"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--color-secondary)",
                    }}
                  >
                    {position.type}
                  </span>
                </div>
                <button
                  type="button"
                  className="py-2.5 px-6 rounded-xl font-semibold border"
                  style={{
                    borderColor: "var(--color-primary)",
                    backgroundColor: "var(--color-primary)",
                    color: "var(--button-text)",
                  }}
                >
                  {t("public.careers.applyButton")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Careers;

