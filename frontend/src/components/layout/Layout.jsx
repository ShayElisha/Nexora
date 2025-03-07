import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SideBar from "../../pages/AdminPanel/layouts/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";
import Flag from "react-world-flags";
import DesignBox from "./DesignBox";

const Layout = ({ children }) => {
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const isAdmin = authUser?.role === "Admin";

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
    en: "us",
    he: "il",
    ru: "ru",
    es: "es",
    fr: "fr",
    ar: "sa",
    ja: "jp",
  };

  useEffect(() => {
    const currentLang = i18n.language;
    const direction = directionMap[currentLang] || "ltr";
    document.documentElement.dir = direction;
  }, [i18n.language]);

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <div className="flex justify-end p-2 sm:p-4 xl:p-6">
        <div className="relative">
          <DesignBox />
          <button
            type="button"
            className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 xl:px-4 xl:py-2 border rounded-md z-20 bg-white text-gray-700 shadow-md text-sm sm:text-base xl:text-lg"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <FaGlobe className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6" />
            <span className="truncate">{t("language.change_language")}</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white shadow-md rounded-md z-20 w-40 sm:w-48 xl:w-56 max-h-64 overflow-y-auto">
              {Object.keys(flagMap).map((lng) => (
                <button
                  key={lng}
                  onClick={() => changeLanguage(lng)}
                  className="flex items-center px-2 py-1 sm:px-3 sm:py-2 xl:px-4 xl:py-2 text-gray-700 hover:bg-gray-100 w-full text-left text-xs sm:text-sm xl:text-base"
                >
                  <Flag
                    code={flagMap[lng]}
                    className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6 mr-1 sm:mr-2 rounded"
                  />
                  <span className="truncate">{t(`${lng}`)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content with Sidebar for Admin */}
      <div className="flex flex-grow w-full">
        {isAdmin && (
          <div className="hidden md:block w-48 md:w-56 lg:w-64 flex-shrink-0">
            <SideBar />
          </div>
        )}
        <main className="flex-grow w-full px-2 sm:px-4 md:px-6">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
