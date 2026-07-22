import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import { usePageLocale } from "../hooks/usePageLocale";

const Contact = () => {
  const { t, isRTL } = usePageLocale();

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.contact.badge")}
        title={t("public.contact.title")}
        subtitle={t("public.contact.subtitle")}
      />
      <section className="py-16 md:py-20">
        <div
          className="max-w-3xl mx-auto px-6"
          style={{ color: "var(--text-color)" }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div
            className="p-7 md:p-8 rounded-2xl border shadow-sm"
            style={{
              backgroundColor: "var(--surface-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-color)" }}>
              {t("public.contact.form.title")}
            </h2>
            <p className="mb-7 text-sm md:text-base" style={{ color: "var(--color-secondary)" }}>
              {t("public.contact.form.description")}
            </p>

            <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
              <div>
                <label htmlFor="fullName" className="block mb-2 text-sm font-semibold">
                  {t("public.contact.form.nameLabel")}
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder={t("public.contact.form.namePlaceholder")}
                  className="w-full p-3 rounded-xl border outline-none"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-semibold">
                  {t("public.contact.form.emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("public.contact.form.emailPlaceholder")}
                  className="w-full p-3 rounded-xl border outline-none"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block mb-2 text-sm font-semibold">
                  {t("public.contact.form.subjectLabel")}
                </label>
                <input
                  id="subject"
                  type="text"
                  placeholder={t("public.contact.form.subjectPlaceholder")}
                  className="w-full p-3 rounded-xl border outline-none"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <div>
                <label htmlFor="message" className="block mb-2 text-sm font-semibold">
                  {t("public.contact.form.messageLabel")}
                </label>
                <textarea
                  id="message"
                  rows="5"
                  placeholder={t("public.contact.form.messagePlaceholder")}
                  className="w-full p-3 rounded-xl border outline-none"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full md:w-auto py-3 px-7 rounded-xl font-semibold border transition-all"
                style={{
                  borderColor: "var(--color-primary)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--button-text)",
                }}
              >
                {t("public.contact.form.submit")}
              </button>
            </form>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Contact;
