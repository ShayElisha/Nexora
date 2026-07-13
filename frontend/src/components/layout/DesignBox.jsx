import { useEffect, useState, useRef } from "react";
import { FaPalette } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  DESIGN_THEMES,
  applyDesignTheme,
  getStoredTheme,
  setStoredTheme,
  notifyThemeChange,
} from "../../lib/designThemes";

const DesignBox = ({ setIsLanguageOpen, isRTL }) => {
  const { t } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    applyDesignTheme(currentTheme);
    setStoredTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const onExternalChange = (e) => setCurrentTheme(e.detail);
    window.addEventListener("nexora-theme-change", onExternalChange);
    return () => window.removeEventListener("nexora-theme-change", onExternalChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTheme = (themeName) => {
    setCurrentTheme(themeName);
    applyDesignTheme(themeName);
    setStoredTheme(themeName);
    notifyThemeChange(themeName);
    setIsOpen(false);
    setIsLanguageOpen(false);
  };

  const toggleColorMenu = () => {
    setIsOpen(!isOpen);
    setIsLanguageOpen(false);
  };

  return (
    <div
      className={`fixed bottom-4 ${isRTL ? "left-4" : "right-4"} z-50`}
      ref={containerRef}
    >
      <button
        onClick={toggleColorMenu}
        className="p-3 bg-gradient-to-r from-primary to-secondary text-button-text rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
        title={t("design.color_palette")}
      >
        <FaPalette className="w-5 h-5" />
      </button>
      {isOpen && (
        <div
          className={`absolute ${
            isRTL ? "left-0" : "right-0"
          } bottom-full mb-2 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl w-64 sm:w-72 xl:w-80 max-h-80 overflow-y-auto border border-gray-200/50 animate-slide-up z-[1000]`}
        >
          <div className="p-4 border-b border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-800 text-center">{t("design.select_theme")}</h3>
            <p className="text-sm text-gray-600 text-center mt-1">{t("design.choose_color_scheme")}</p>
          </div>
          <div className="p-2">
            {Object.keys(DESIGN_THEMES).map((themeName) => (
              <button
                key={themeName}
                onClick={() => handleSelectTheme(themeName)}
                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full ${
                  isRTL ? "text-right" : "text-left"
                } text-sm sm:text-base transition-all duration-200 rounded-xl mb-1 group`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 ${
                      isRTL ? "ml-3" : "mr-3"
                    } rounded-full shadow-md ring-2 ring-white group-hover:ring-4 group-hover:ring-opacity-50 transition-all duration-200`}
                    style={{
                      backgroundColor: DESIGN_THEMES[themeName]["--color-primary"],
                    }}
                  />
                  <div className="flex space-x-1">
                    {["--color-primary", "--color-secondary", "--color-accent"].map((key) => (
                      <div
                        key={key}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: DESIGN_THEMES[themeName][key] }}
                      />
                    ))}
                  </div>
                </div>
                <span className="truncate font-medium capitalize">{t(`design.themes.${themeName}`)}</span>
                {currentTheme === themeName && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignBox;
