import { AlertTriangle, CheckCircle2, Circle, Info } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import { usePageLocale } from "../hooks/usePageLocale";

const Status = () => {
  const { t } = usePageLocale();
  const services = t("public.status.services", { returnObjects: true }) || [];
  const incidents = t("public.status.incidents", { returnObjects: true }) || [];
  const statusLabels = t("public.status.statusLabels", { returnObjects: true }) || {};
  const allOperational = services.every((service) => service.status === "operational");

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "var(--color-primary)";
      case "degraded":
        return "var(--color-accent)";
      case "down":
        return "#b91c1c";
      default:
        return "var(--color-secondary)";
    }
  };

  const getSeverityIcon = (severity) => {
    if (severity === "success") return <CheckCircle2 size={18} style={{ color: "var(--color-primary)" }} />;
    if (severity === "info") return <Info size={18} style={{ color: "var(--color-secondary)" }} />;
    return <AlertTriangle size={18} style={{ color: "#b91c1c" }} />;
  };

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.status.badge")}
        title={allOperational ? t("public.status.allOperational") : t("public.status.degradedTitle")}
        subtitle={`${t("public.status.lastUpdatedLabel")}: ${new Date().toLocaleString()}`}
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.status.servicesTitle")}
          </h2>
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Circle size={14} fill={getStatusColor(service.status)} style={{ color: getStatusColor(service.status) }} />
                  <div>
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {service.name}
                    </h3>
                    <p className="text-xs" style={{ color: getStatusColor(service.status) }}>
                      {statusLabels[service.status] || statusLabels.unknown}
                    </p>
                  </div>
                </div>
                <div className="flex gap-5 text-xs">
                  <span style={{ color: "var(--color-secondary)" }}>
                    {t("public.status.uptimeLabel")}: <strong style={{ color: "var(--text-color)" }}>{service.uptime}</strong>
                  </span>
                  <span style={{ color: "var(--color-secondary)" }}>
                    {t("public.status.responseLabel")}: <strong style={{ color: "var(--text-color)" }}>{service.response}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: "var(--text-color)" }}>
            {t("public.status.incidentsTitle")}
          </h2>
          <div className="space-y-4">
            {incidents.map((incident) => (
              <article
                key={`${incident.date}-${incident.title}`}
                className="p-5 rounded-xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(incident.severity)}
                    <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                      {incident.title}
                    </h3>
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-secondary)" }}>
                    {incident.date}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                  {incident.description}
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
              {t("public.status.subscribeTitle")}
            </h2>
            <p className="mb-6" style={{ color: "var(--color-secondary)" }}>
              {t("public.status.subscribeSubtitle")}
            </p>
            <form className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto" onSubmit={(event) => event.preventDefault()}>
              <input
                type="email"
                placeholder={t("public.status.emailPlaceholder")}
                className="flex-1 p-3 rounded-xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
              <button
                type="submit"
                className="py-3 px-6 rounded-xl font-semibold border"
                style={{
                  borderColor: "var(--color-primary)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--button-text)",
                }}
              >
                {t("public.status.subscribeButton")}
              </button>
            </form>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Status;

