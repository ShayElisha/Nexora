import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary text-white py-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Section 1: Logo and Description */}
        <div className="mb-0 md:mb-0">
          <img
            src="../../../public/assets/logo.png"
            style={{ width: "90px", height: "90px" }}
            alt={t("footer.logo_alt")}
          />
          <p className="text-sm mt-2">{t("footer.description")}</p>
        </div>

        {/* Section 2: Links */}
        <div className="mb-4 md:mb-0 flex flex-col md:flex-row gap-4">
          <a href="/about" className="hover:text-primary">
            {t("footer.about_us")}
          </a>
          <a href="/services" className="hover:text-primary">
            {t("footer.services")}
          </a>
          <a href="/contact" className="hover:text-primary">
            {t("footer.contact")}
          </a>
          <a href="/privacy" className="hover:text-primary">
            {t("footer.privacy_policy")}
          </a>
        </div>

        {/* Section 3: Social Media */}
        <div className="flex gap-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            <i className="fab fa-facebook-f"></i>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            <i className="fab fa-twitter"></i>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            <i className="fab fa-instagram"></i>
          </a>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 border-t border-border-color pt-4 text-center text-sm">
        <p>
          &copy; {t("footer.current_year", { year: new Date().getFullYear() })}{" "}
          {t("footer.company_name")}. {t("footer.all_rights_reserved")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
