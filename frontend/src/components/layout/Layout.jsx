import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import "./translations.json";

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation(); // ייבוא פונקציות תרגום
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng); // שינוי שפה
    setIsDropdownOpen(false);
  };

  const directionMap = {
    en: "ltr",
    he: "rtl",
    ru: "ltr",
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
        <div className="fixed z-20 relative">
          <button
            type="button"
            className=" inline-flex items-center px-4 py-2 border rounded-md bg-white text-gray-700"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <FaGlobe className="mr-2" /> {t("language.change_language")}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white shadow-md rounded-md">
              {["en", "he", "ru"].map((lng) => (
                <button
                  key={lng}
                  onClick={() => changeLanguage(lng)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                >
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
