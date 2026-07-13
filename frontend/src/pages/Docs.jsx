import { useState } from "react";
import { Boxes, Link2, Rocket, Settings, Users, Wallet } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import { usePageLocale } from "../hooks/usePageLocale";

const Docs = () => {
  const { t } = usePageLocale();
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const categories = t("public.docs.categories", { returnObjects: true }) || [];
  const docsByCategory = t("public.docs.content", { returnObjects: true }) || {};
  const iconByCategory = {
    "getting-started": Rocket,
    employees: Users,
    finance: Wallet,
    inventory: Boxes,
    api: Settings,
    integrations: Link2,
  };

  return (
    <PublicPageLayout>
      <PublicPageHero badge={t("public.docs.badge")} title={t("public.docs.title")} subtitle={t("public.docs.subtitle")} />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-72">
              <div
                className="p-4 rounded-xl border sticky top-24"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <h3 className="font-semibold mb-3" style={{ color: "var(--text-color)" }}>
                  {t("public.docs.categoriesLabel")}
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = iconByCategory[category.id] || Settings;
                    const active = activeCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setActiveCategory(category.id)}
                        className="w-full p-3 rounded-lg text-sm flex items-center gap-2 border"
                        style={{
                          borderColor: active ? "var(--color-primary)" : "var(--border-color)",
                          backgroundColor: active ? "var(--color-primary)" : "var(--bg-color)",
                          color: active ? "var(--button-text)" : "var(--text-color)",
                        }}
                      >
                        <Icon size={16} />
                        {category.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(docsByCategory[activeCategory] || []).map((doc) => (
                <article
                  key={doc.title}
                  className="p-5 rounded-xl border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {doc.title}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "var(--border-color)" }}>
                      {doc.time}
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "var(--color-secondary)" }}>
                    {t("public.docs.guideDescription")}
                  </p>
                  <button type="button" className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                    {t("public.docs.readMore")}
                  </button>
                </article>
              ))}
            </div>
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
              {t("public.docs.videoTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.docs.videoSubtitle")}
            </p>
            <button
              type="button"
              className="py-3 px-7 rounded-xl font-semibold border"
              style={{
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              {t("public.docs.videoButton")}
            </button>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Docs;

