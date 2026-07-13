import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bug, CircleDot, Database, Gauge, Palette, Shield, Wrench } from "lucide-react";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import { usePageLocale } from "../hooks/usePageLocale";

const Report = () => {
  const { t } = usePageLocale();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: "",
    severity: "",
    title: "",
    description: "",
    steps: "",
    email: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const bugTypes = t("public.report.bugTypes", { returnObjects: true }) || [];
  const severityLevels = t("public.report.severityLevels", { returnObjects: true }) || [];

  const bugTypeIcons = {
    ui: Palette,
    functionality: Wrench,
    performance: Gauge,
    security: Shield,
    data: Database,
    other: Bug,
  };

  const severityColor = {
    low: "var(--color-primary)",
    medium: "var(--color-accent)",
    high: "var(--color-secondary)",
    critical: "var(--text-color)",
  };

  // Map bug types to support ticket categories
  const mapBugTypeToCategory = (type) => {
    const mapping = {
      ui: "Bug Report",
      functionality: "Bug Report",
      performance: "Technical Support",
      security: "Bug Report",
      data: "Bug Report",
      other: "General Question"
    };
    return mapping[type] || "Bug Report";
  };

  // Map severity to priority
  const mapSeverityToPriority = (severity) => {
    const mapping = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Urgent"
    };
    return mapping[severity] || "Medium";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.severity || !formData.title || !formData.description) {
      toast.error(t("public.report.errors.required"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine description and steps
      const fullDescription = formData.steps
        ? `${formData.description}\n\nשלבים לשחזור הבעיה:\n${formData.steps}`
        : formData.description;

      // Create support ticket
      const ticketData = {
        title: formData.title,
        description: fullDescription,
        category: mapBugTypeToCategory(formData.type),
        priority: mapSeverityToPriority(formData.severity)
      };

      const response = await axiosInstance.post("/support-tickets", ticketData);
      
      if (response.data.success) {
        toast.success(t("public.report.messages.success"));
        
        // Reset form
        setFormData({
          type: "",
          severity: "",
          title: "",
          description: "",
          steps: "",
          email: ""
        });

        // Optionally redirect to dashboard if user is logged in
        // You can check if user is logged in and redirect accordingly
        setTimeout(() => {
          // Check if user is authenticated (you might want to check this differently)
          const isAuthenticated = document.cookie.includes("auth_token");
          if (isAuthenticated) {
            navigate("/dashboard/support-tickets");
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating support ticket:", error);
      
      if (error.response?.status === 401) {
        toast.error(t("public.report.errors.auth"));
        // Optionally redirect to login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(
          error.response?.data?.message || 
          t("public.report.errors.generic")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageLayout>
      <PublicPageHero badge={t("public.report.badge")} title={t("public.report.title")} subtitle={t("public.report.subtitle")} />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-lg font-bold mb-4" style={{ color: "var(--text-color)" }}>
                {t("public.report.form.typeLabel")}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {bugTypes.map((type) => {
                  const Icon = bugTypeIcons[type.value] || Bug;
                  const selected = formData.type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className="p-3 rounded-xl border text-sm"
                      style={{
                        borderColor: selected ? "var(--color-primary)" : "var(--border-color)",
                        backgroundColor: selected ? "var(--color-primary)" : "var(--bg-color)",
                        color: selected ? "var(--button-text)" : "var(--text-color)",
                      }}
                    >
                      <Icon size={18} className="mx-auto mb-2" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold mb-4" style={{ color: "var(--text-color)" }}>
                {t("public.report.form.severityLabel")}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {severityLevels.map((level) => {
                  const selected = formData.severity === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: level.value })}
                      className="p-3 rounded-xl border text-sm"
                      style={{
                        borderColor: selected ? severityColor[level.value] : "var(--border-color)",
                        backgroundColor: selected ? severityColor[level.value] : "var(--bg-color)",
                        color: selected ? "var(--button-text)" : "var(--text-color)",
                      }}
                    >
                      <CircleDot size={16} className="mx-auto mb-2" />
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold mb-2" style={{ color: "var(--text-color)" }}>
                {t("public.report.form.titleLabel")}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                required
                placeholder={t("public.report.form.titlePlaceholder")}
                className="w-full p-3 rounded-xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>

            <div>
              <label className="block text-lg font-bold mb-2" style={{ color: "var(--text-color)" }}>
                {t("public.report.form.descriptionLabel")}
              </label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                required
                rows={6}
                placeholder={t("public.report.form.descriptionPlaceholder")}
                className="w-full p-3 rounded-xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>

            <div>
              <label className="block text-lg font-bold mb-2" style={{ color: "var(--text-color)" }}>
                {t("public.report.form.stepsLabel")}
              </label>
              <textarea
                value={formData.steps}
                onChange={(event) => setFormData({ ...formData, steps: event.target.value })}
                rows={4}
                placeholder={t("public.report.form.stepsPlaceholder")}
                className="w-full p-3 rounded-xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>

            <div>
              <label className="block text-lg font-bold mb-2" style={{ color: "var(--text-color)" }}>
                {t("public.report.form.emailLabel")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder={t("public.report.form.emailPlaceholder")}
                className="w-full p-3 rounded-xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-8 rounded-xl font-semibold border disabled:opacity-60"
                style={{
                  borderColor: "var(--color-primary)",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--button-text)",
                }}
              >
                {isSubmitting ? t("public.report.messages.sending") : t("public.report.form.submit")}
              </button>
            </div>
          </form>
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
            <AlertTriangle size={26} className="mx-auto mb-4" style={{ color: "var(--color-primary)" }} />
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "var(--text-color)" }}>
              {t("public.report.messages.thanksTitle")}
            </h2>
            <p style={{ color: "var(--color-secondary)" }}>{t("public.report.messages.thanksSubtitle")}</p>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Report;

