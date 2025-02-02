import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";

// אם אתה משתמש בדגלים חיצוניים כמו react-world-flags
import Flag from "react-world-flags";

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsDropdownOpen(false);
  };

  const directionMap = {
    en: "ltr",
    he: "rtl",
    ru: "ltr",
    es: "ltr",
    fr: "ltr",
    ar: "rtl",
    ja: "ltr",
  };

  const flagMap = {
    en: "us", // United States
    he: "il", // Israel
    ru: "ru", // Russia
    es: "es", // Spain
    fr: "fr", // France
    ar: "sa", // Saudi Arabia
    ja: "jp", // Japan
  };

  useEffect(() => {
    const currentLang = i18n.language;
    const direction = directionMap[currentLang] || "ltr";
    document.documentElement.dir = direction;
  }, [i18n.language]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex justify-end p-4">
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border rounded-md z-20 bg-white text-gray-700 shadow-md"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <FaGlobe className="mr-2" /> {t("language.change_language")}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white shadow-md rounded-md z-20">
              {Object.keys(flagMap).map((lng) => (
                <button
                  key={lng}
                  onClick={() => changeLanguage(lng)}
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Flag code={flagMap[lng]} className="w-5 h-5 mr-2 rounded" />
                  {t(`${lng}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
