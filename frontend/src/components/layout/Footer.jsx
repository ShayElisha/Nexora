import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  return (
    <footer 
      className="relative overflow-hidden bg-primary"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Decorative top border */}
      <div 
        className="h-1"
        style={{
          background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`
        }}
      />
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/logo.png"
                style={{ width: "60px", height: "60px" }}
            alt={t("footer.logo_alt")}
          />
              <h3 
                className="text-2xl font-bold"
                style={{
                  background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Nexora
              </h3>
        </div>
            <p 
              className="mb-6 text-sm leading-relaxed text-white"
              style={{ opacity: 0.9 }}
            >
              {t("footer.description")}
            </p>
            <div className="flex gap-3">
              {[
                { 
                  Icon: Facebook, 
                  url: 'https://facebook.com/nexora',
                  label: 'Facebook',
                  color: '#1877F2'
                },
                { 
                  Icon: Twitter, 
                  url: 'https://twitter.com/nexora',
                  label: 'Twitter',
                  color: '#1DA1F2'
                },
                { 
                  Icon: Instagram, 
                  url: 'https://instagram.com/nexora',
                  label: 'Instagram',
                  color: '#E4405F'
                },
                { 
                  Icon: Linkedin, 
                  url: 'https://linkedin.com/company/nexora',
                  label: 'LinkedIn',
                  color: '#0A66C2'
                }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                  style={{
                    backgroundColor: 'white',
                    color: social.color
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = social.color;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = social.color;
                  }}
                >
                  <social.Icon size={20} strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 
              className="font-bold text-lg mb-4 text-white"
            >
              {t("footer.product")}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t("footer.features"), url: '/features' },
                { label: t("footer.pricing"), url: '/pricing-plans' },
                { label: t("footer.security"), url: '/security' },
                { label: t("footer.integrations"), url: '/integrations' },
                { label: 'API', url: '/api' }
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.url}
                    className={`text-sm text-white transition-all duration-300 inline-block hover:text-secondary ${
                      isRTL ? 'hover:translate-x-2' : 'hover:-translate-x-2'
                    }`}
                    style={{ opacity: 0.8 }}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 
              className="font-bold text-lg mb-4 text-white"
            >
              {t("footer.company")}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t("footer.about_us"), url: '/about' },
                { label: t("footer.careers"), url: '/careers' },
                { label: t("footer.blog"), url: '/blog' },
                { label: t("footer.customers"), url: '/customers' },
                { label: t("footer.partners"), url: '/partners' }
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.url}
                    className={`text-sm text-white transition-all duration-300 inline-block hover:text-secondary ${
                      isRTL ? 'hover:translate-x-2' : 'hover:-translate-x-2'
                    }`}
                    style={{ opacity: 0.8 }}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 
              className="font-bold text-lg mb-4 text-white"
            >
              {t("footer.support")}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t("footer.help_center"), url: '/help' },
                { label: t("footer.documentation"), url: '/docs' },
                { label: t("footer.contact"), url: '/contact' },
                { label: t("footer.status"), url: '/status' },
                { label: t("footer.report_bug"), url: '/report' }
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.url}
                    className={`text-sm text-white transition-all duration-300 inline-block hover:text-secondary ${
                      isRTL ? 'hover:translate-x-2' : 'hover:-translate-x-2'
                    }`}
                    style={{ opacity: 0.8 }}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p 
            className="text-sm text-white"
            style={{ opacity: 0.8 }}
          >
            © {new Date().getFullYear()} {t("footer.company_name")}. {t("footer.all_rights_reserved")}
          </p>
          <div className="flex gap-6">
            {[
              { label: t("footer.terms"), url: '/terms' },
              { label: t("footer.privacy_policy"), url: '/privacy' },
              { label: t("footer.cookies"), url: '/cookies' }
            ].map((item, i) => (
              <Link
                key={i}
                to={item.url}
                className="text-sm text-white transition-all duration-300 hover:text-secondary"
                style={{ opacity: 0.8 }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.8'}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
