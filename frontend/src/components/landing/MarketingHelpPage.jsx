import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection from "./LandingSection";
import { landingCard, cardStyle } from "./landingStyles";

const MarketingHelpPage = () => {
  const { t } = useTranslation();
  const base = "landing.pages.help";
  const [search, setSearch] = useState("");
  const categories = t(`${base}.categories`, { returnObjects: true, defaultValue: [] });
  const list = Array.isArray(categories) ? categories : [];
  const filtered = list.filter(
    (c) =>
      !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} />
      <LandingSection>
        <div className="max-w-xl mx-auto mb-10 relative">
          <Search
            size={18}
            className="absolute top-1/2 -translate-y-1/2 start-4"
            style={{ color: "var(--color-secondary)" }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(`${base}.search_placeholder`)}
            className="w-full py-3 ps-11 pe-4 text-sm rounded-xl border outline-none"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              color: "var(--text-color)",
            }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cat, index) => (
            <div key={index} className={`${landingCard}`} style={cardStyle}>
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="font-bold mb-2" style={{ color: "var(--color-primary)" }}>{cat.title}</h3>
              <p className="text-sm mb-3" style={{ color: "var(--color-secondary)" }}>{cat.description}</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-color)" }}>
                {cat.articles} {t(`${base}.articles_label`)}
              </p>
            </div>
          ))}
        </div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingHelpPage;
