import { useTranslation } from "react-i18next";
import LandingPageShell from "./LandingPageShell";
import LandingPageHero from "./LandingPageHero";
import LandingSection from "./LandingSection";
import { landingBtnPrimary, primaryBtnStyle, landingCard, cardStyle } from "./landingStyles";

const MarketingContactPage = () => {
  const { t } = useTranslation();
  const base = "landing.pages.contact";

  const fields = [
    { id: "fullName", label: t(`${base}.form.name`), placeholder: t(`${base}.form.name_placeholder`), type: "text" },
    { id: "email", label: t(`${base}.form.email`), placeholder: t(`${base}.form.email_placeholder`), type: "email" },
    { id: "subject", label: t(`${base}.form.subject`), placeholder: t(`${base}.form.subject_placeholder`), type: "text" },
  ];

  return (
    <LandingPageShell>
      <LandingPageHero title={t(`${base}.title`)} subtitle={t(`${base}.subtitle`)} />
      <LandingSection tight>
        <div className={`max-w-2xl mx-auto ${landingCard} p-8`} style={cardStyle}>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
            {t(`${base}.form.title`)}
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-secondary)" }}>
            {t(`${base}.form.description`)}
          </p>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {fields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-color)" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  id={field.id}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border outline-none focus:ring-2 transition-shadow"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            ))}
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-color)" }}>
                {t(`${base}.form.message`)}
              </label>
              <textarea
                id="message"
                rows={5}
                placeholder={t(`${base}.form.message_placeholder`)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border outline-none focus:ring-2 transition-shadow resize-y"
                style={{
                  backgroundColor: "var(--bg-color)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>
            <button type="submit" className={landingBtnPrimary} style={primaryBtnStyle}>
              {t(`${base}.form.submit`)}
            </button>
          </form>
        </div>
      </LandingSection>
    </LandingPageShell>
  );
};

export default MarketingContactPage;
