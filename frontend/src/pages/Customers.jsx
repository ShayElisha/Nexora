import { useNavigate } from "react-router-dom";
import { Briefcase, Building2, GraduationCap, HeartPulse, Laptop, Quote, Star, Store } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import { usePageLocale } from "../hooks/usePageLocale";

const Customers = () => {
  const { t } = usePageLocale();
  const navigate = useNavigate();
  const stats = t("public.customers.stats", { returnObjects: true }) || [];
  const industries = t("public.customers.industries", { returnObjects: true }) || [];
  const testimonials = t("public.customers.testimonials", { returnObjects: true }) || [];
  const industryIcons = [Laptop, Store, Building2, HeartPulse, GraduationCap, Briefcase];

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.customers.badge")}
        title={t("public.customers.title")}
        subtitle={t("public.customers.subtitle")}
      />

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl border text-center"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
              }}
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
                {stat.number}
              </h3>
              <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.customers.industriesTitle")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {industries.map((industry, index) => {
              const Icon = industryIcons[index % industryIcons.length];
              return (
                <div
                  key={industry.name}
                  className="p-4 rounded-xl border text-center"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                >
                  <Icon size={24} className="mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
                  <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text-color)" }}>
                    {industry.name}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--color-secondary)" }}>
                    {industry.count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.customers.testimonialsTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.company}
                className="p-6 rounded-2xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg" style={{ color: "var(--text-color)" }}>
                    {testimonial.company}
                  </h3>
                  <Quote size={18} style={{ color: "var(--color-primary)" }} />
                </div>
                <div className="flex gap-2 mb-4">
                  <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "var(--border-color)" }}>
                    {testimonial.industry}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "var(--border-color)" }}>
                    {testimonial.size}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-secondary)" }}>
                  {testimonial.text}
                </p>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={`${testimonial.company}-${index}`} size={14} fill="currentColor" style={{ color: "var(--color-primary)" }} />
                  ))}
                </div>
                <p className="font-semibold text-sm" style={{ color: "var(--text-color)" }}>
                  {testimonial.name}
                </p>
                <p className="text-xs" style={{ color: "var(--color-secondary)" }}>
                  {testimonial.role}
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
              {t("public.customers.ctaTitle")}
            </h2>
            <p className="mb-7" style={{ color: "var(--color-secondary)" }}>
              {t("public.customers.ctaSubtitle")}
            </p>
            <button
              onClick={() => navigate("/create-company")}
              className="py-3 px-7 rounded-xl font-semibold border"
              style={{
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-primary)",
                color: "var(--button-text)",
              }}
            >
              {t("public.customers.ctaButton")}
            </button>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Customers;

