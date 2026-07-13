import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Github, Linkedin } from "lucide-react";

const XIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LandingFooter = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const columns = [
    {
      titleKey: "footer.product",
      links: [
        { labelKey: "footer.features", url: "/features" },
        { labelKey: "footer.pricing", url: "/pricing-plans" },
        { labelKey: "footer.security", url: "/security" },
        { labelKey: "footer.integrations", url: "/integrations" },
        { label: "API", url: "/api" },
      ],
    },
    {
      titleKey: "footer.company",
      links: [
        { labelKey: "footer.about_us", url: "/about" },
        { labelKey: "footer.careers", url: "/careers" },
        { labelKey: "footer.blog", url: "/blog" },
        { labelKey: "footer.customers", url: "/customers" },
        { labelKey: "footer.partners", url: "/partners" },
      ],
    },
    {
      titleKey: "footer.support",
      links: [
        { labelKey: "footer.help_center", url: "/help" },
        { labelKey: "footer.documentation", url: "/docs" },
        { labelKey: "footer.contact", url: "/contact" },
        { labelKey: "footer.status", url: "/status" },
      ],
    },
    {
      title: isRTL ? "משפטי" : "Legal",
      links: [
        { labelKey: "footer.terms", url: "/terms" },
        { labelKey: "footer.privacy_policy", url: "/privacy" },
        { labelKey: "footer.cookies", url: "/cookies" },
      ],
    },
  ];

  const social = [
    { Icon: Linkedin, url: "https://linkedin.com/company/nexora", label: "LinkedIn" },
    { Icon: XIcon, url: "https://twitter.com/nexora", label: "X" },
    { Icon: Github, url: "https://github.com/nexora", label: "GitHub" },
  ];

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: "var(--footer-bg)", borderColor: "var(--border-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {columns.map((col) => (
            <div key={col.titleKey || col.title}>
              <h4
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "var(--text-color)" }}
              >
                {col.title || t(col.titleKey)}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.url}>
                    <Link
                      to={link.url}
                      className="text-sm transition-colors duration-200 hover:opacity-80"
                      style={{ color: "var(--color-secondary)" }}
                    >
                      {link.label || t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className={`pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${
            isRTL ? "md:flex-row-reverse" : ""
          }`}
          style={{ borderColor: "var(--border-color)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
            © {new Date().getFullYear()} {t("footer.company_name")}. {t("footer.all_rights_reserved")}
          </p>
          <div className="flex gap-3">
            {social.map(({ Icon, url, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors duration-200 hover:opacity-80"
                style={{ borderColor: "var(--border-color)", color: "var(--color-secondary)" }}
              >
                <Icon size={16} strokeWidth={label === "X" ? 0 : 1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
