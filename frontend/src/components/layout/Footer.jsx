// src/components/Footer.jsx
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300 py-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        {/* Section 1: Logo and Description */}
        <div className="mb-4 md:mb-0">
          <h1 className="text-blue-400 text-xl font-bold">
            {t("footer.company_name")}
          </h1>
          <p className="text-sm mt-2">{t("footer.description")}</p>
        </div>

        {/* Section 2: Links */}
        <div className="mb-4 md:mb-0 flex flex-col md:flex-row gap-4">
          <a href="/about" className="hover:text-blue-400">
            {t("footer.about_us")}
          </a>
          <a href="/services" className="hover:text-blue-400">
            {t("footer.services")}
          </a>
          <a href="/contact" className="hover:text-blue-400">
            {t("footer.contact")}
          </a>
          <a href="/privacy" className="hover:text-blue-400">
            {t("footer.privacy_policy")}
          </a>
        </div>

        {/* Section 3: Social Media */}
        <div className="flex gap-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            <i className="fab fa-facebook-f"></i>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            <i className="fab fa-twitter"></i>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400"
          >
            <i className="fab fa-instagram"></i>
          </a>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 border-t border-gray-700 pt-4 text-center text-sm">
        <p>
          &copy; {t("footer.current_year", { year: new Date().getFullYear() })}{" "}
          {t("footer.company_name")}. {t("footer.all_rights_reserved")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
