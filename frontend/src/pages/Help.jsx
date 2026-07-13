import { useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, CircleHelp, Rocket, Settings, Users, Wallet } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import { usePageLocale } from "../hooks/usePageLocale";

const Help = () => {
  const { t } = usePageLocale();
  const [searchTerm, setSearchTerm] = useState("");

  const categories = t("public.help.categories", { returnObjects: true }) || [];
  const faq = t("public.help.faq", { returnObjects: true }) || [];
  const categoryIcons = [Rocket, Users, Wallet, Boxes, CircleHelp, Settings];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => {
    if (!normalizedSearch) return true;
    return `${category.title} ${category.description}`.toLowerCase().includes(normalizedSearch);
  });
  const filteredFaq = faq.filter((item) => {
    if (!normalizedSearch) return true;
    return `${item.question} ${item.answer}`.toLowerCase().includes(normalizedSearch);
  });

  return (
    <PublicPageLayout>
      <PublicPageHero badge={t("public.help.badge")} title={t("public.help.title")} subtitle={t("public.help.subtitle")} />

      <section className="pt-2 pb-12">
        <div className="max-w-2xl mx-auto px-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("public.help.searchPlaceholder")}
            className="w-full p-3 rounded-xl border"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              color: "var(--text-color)",
            }}
          />
        </div>
      </section>

      <section className="pb-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.help.categoriesTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length];
              return (
                <article
                  key={category.title}
                  className="p-5 rounded-xl border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                >
                  <Icon size={20} className="mb-3" style={{ color: "var(--color-primary)" }} />
                  <h3 className="font-semibold mb-1" style={{ color: "var(--text-color)" }}>
                    {category.title}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: "var(--color-secondary)" }}>
                    {category.description}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-primary)" }}>
                    {category.articles}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.help.faqTitle")}
          </h2>
          <div className="space-y-4">
            {filteredFaq.map((item) => (
              <article
                key={item.question}
                className="p-5 rounded-xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <h3 className="font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                  {item.question}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-secondary)" }}>
                  {item.answer}
                </p>
              </article>
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
              {t("public.help.supportTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.help.supportSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/contact"
                className="py-3 px-6 rounded-xl font-semibold border"
                style={{
                  borderColor: "var(--color-primary)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--button-text)",
                }}
              >
                {t("public.help.contactButton")}
              </Link>
              <Link
                to="/docs"
                className="py-3 px-6 rounded-xl font-semibold border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                {t("public.help.docsButton")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Help;

