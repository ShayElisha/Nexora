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
  // שליפת נתוני המשתמש (לצורך הצגת Sidebar לדוגמא)
  const { data: authData } = useQuery({
    queryKey: ["authUser"],
  });
  const authUser = authData?.user;
  const isAdmin = authUser?.role === "Admin"; // בדיקה אם המשתמש אדמין

  const { t, i18n } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // שינוי שפה (לדוגמא)
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex justify-end p-4">
        <div className="relative">
          {/* תיבת עיצובים – המשתמש יכול לשנות את הצבעים והרקע */}
          <DesignBox />
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

      {/* במידה והמשתמש הוא אדמין, נציג את Sidebar */}
      <div className="flex flex-grow">
        {isAdmin && <SideBar />}
        <main className="flex-grow">{children}</main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
