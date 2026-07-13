import { useState } from "react";
import { BarChart3, Megaphone, Settings, Shield } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import { usePageLocale } from "../hooks/usePageLocale";

const Cookies = () => {
  const { t } = usePageLocale();

  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false
  });

  const cookieTypes = t("public.cookies.cookieTypes", { returnObjects: true }) || [];
  const cookieIcons = {
    necessary: Shield,
    functional: Settings,
    analytics: BarChart3,
    marketing: Megaphone,
  };

  const handleToggle = (id) => {
    if (id !== "necessary") {
      setPreferences(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    alert(t("public.cookies.savedMessage"));
  };

  return (
    <PublicPageLayout>
      <PublicPageHero badge={t("public.cookies.badge")} title={t("public.cookies.title")} subtitle={t("public.cookies.subtitle")} />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div
            className="p-6 rounded-xl border"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
            }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-color)" }}>
              {t("public.cookies.introTitle")}
            </h2>
            <p className="mb-3" style={{ color: "var(--color-secondary)" }}>
              {t("public.cookies.introParagraphOne")}
            </p>
            <p style={{ color: "var(--color-secondary)" }}>{t("public.cookies.introParagraphTwo")}</p>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.cookies.typesTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cookieTypes.map((cookie) => {
              const Icon = cookieIcons[cookie.id] || Settings;
              return (
                <article
                  key={cookie.id}
                  className="p-5 rounded-xl border"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <Icon size={18} className="mb-2" style={{ color: "var(--color-primary)" }} />
                      <h3 className="font-semibold mb-1" style={{ color: "var(--text-color)" }}>
                        {cookie.title}
                      </h3>
                      {cookie.required && (
                        <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "var(--border-color)" }}>
                          {t("public.cookies.requiredLabel")}
                        </span>
                      )}
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[cookie.id]}
                        onChange={() => handleToggle(cookie.id)}
                        disabled={cookie.required}
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 rounded-full peer"
                        style={{
                          backgroundColor: preferences[cookie.id] ? "var(--color-primary)" : "var(--border-color)",
                          opacity: cookie.required ? 0.6 : 1,
                        }}
                      />
                      <span
                        className="absolute left-[2px] top-[2px] w-5 h-5 rounded-full transition-transform"
                        style={{
                          backgroundColor: "var(--bg-color)",
                          transform: preferences[cookie.id] ? "translateX(20px)" : "translateX(0)",
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                    {cookie.description}
                  </p>
                </article>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <button
              type="button"
              onClick={handleSavePreferences}
              className="py-3 px-7 rounded-xl font-semibold border"
              style={{
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              {t("public.cookies.saveButton")}
            </button>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-20 pt-14">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            className="rounded-2xl border p-8 md:p-10"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "var(--text-color)" }}>
              {t("public.cookies.manageTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.cookies.manageSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(t("public.cookies.browsers", { returnObjects: true }) || []).map((browser) => (
                <span
                  key={browser}
                  className="px-4 py-2 rounded-full border text-sm"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                >
                  {browser}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Cookies;

