import React, { useEffect, useState, useRef } from "react";
import { FaPalette } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const DesignBox = ({ setIsLanguageOpen, isRTL }) => {
  const { t } = useTranslation();
  const themes = {
    default: {
      "--color-primary": "#2563EB",
      "--color-secondary": "#64748B",
      "--color-accent": "#059669",
      "--bg-color": "#FFFFFF",
      "--text-color": "#0F172A",
      "--button-bg": "#2563EB",
      "--button-text": "#FFFFFF",
      "--border-color": "#E2E8F0",
      "--footer-bg": "#F8FAFC",
    },
    royal: {
      "--color-primary": "#7C3AED",
      "--color-secondary": "#A855F7",
      "--color-accent": "#EC4899",
      "--bg-color": "#FEFBFF",
      "--text-color": "#1E1B4B",
      "--button-bg": "#7C3AED",
      "--button-text": "#FFFFFF",
      "--border-color": "#E9D5FF",
      "--footer-bg": "#F3E8FF",
    },
    opulent: {
      "--color-primary": "#DC2626",
      "--color-secondary": "#F59E0B",
      "--color-accent": "#059669",
      "--bg-color": "#FFFBEB",
      "--text-color": "#451A03",
      "--button-bg": "#DC2626",
      "--button-text": "#FFFFFF",
      "--border-color": "#FED7AA",
      "--footer-bg": "#FEF3C7",
    },
    elegant: {
      "--color-primary": "#374151",
      "--color-secondary": "#6B7280",
      "--color-accent": "#9CA3AF",
      "--bg-color": "#FAFAFA",
      "--text-color": "#111827",
      "--button-bg": "#374151",
      "--button-text": "#FFFFFF",
      "--border-color": "#E5E7EB",
      "--footer-bg": "#F3F4F6",
    },
    modern: {
      "--color-primary": "#0EA5E9",
      "--color-secondary": "#06B6D4",
      "--color-accent": "#10B981",
      "--bg-color": "#FFFFFF",
      "--text-color": "#0F172A",
      "--button-bg": "#0EA5E9",
      "--button-text": "#FFFFFF",
      "--border-color": "#E0F2FE",
      "--footer-bg": "#F0F9FF",
    },
    vintage: {
      "--color-primary": "#92400E",
      "--color-secondary": "#B45309",
      "--color-accent": "#D97706",
      "--bg-color": "#FFFBEB",
      "--text-color": "#451A03",
      "--button-bg": "#92400E",
      "--button-text": "#FFFFFF",
      "--border-color": "#FED7AA",
      "--footer-bg": "#FEF3C7",
    },
    midnight: {
      "--color-primary": "#3B82F6",
      "--color-secondary": "#6366F1",
      "--color-accent": "#8B5CF6",
      "--bg-color": "#0F172A",
      "--text-color": "#F1F5F9",
      "--button-bg": "#3B82F6",
      "--button-text": "#FFFFFF",
      "--border-color": "#334155",
      "--footer-bg": "#1E293B",
    },
    neon: {
      "--color-primary": "#00F5FF",
      "--color-secondary": "#FF00FF",
      "--color-accent": "#00FF00",
      "--bg-color": "#0A0A0A",
      "--text-color": "#FFFFFF",
      "--button-bg": "#00F5FF",
      "--button-text": "#0A0A0A",
      "--border-color": "#FF00FF",
      "--footer-bg": "#1A1A1A",
    },
    sunsetGold: {
      "--color-primary": "#D97706",
      "--color-secondary": "#F59E0B",
      "--color-accent": "#FCD34D",
      "--bg-color": "#FFFBEB",
      "--text-color": "#451A03",
      "--button-bg": "#D97706",
      "--button-text": "#FFFFFF",
      "--border-color": "#FED7AA",
      "--footer-bg": "#FEF3C7",
    },
    glacier: {
      "--color-primary": "#0F766E",
      "--color-secondary": "#14B8A6",
      "--color-accent": "#5EEAD4",
      "--bg-color": "#F0FDFA",
      "--text-color": "#134E4A",
      "--button-bg": "#0F766E",
      "--button-text": "#FFFFFF",
      "--border-color": "#99F6E4",
      "--footer-bg": "#CCFBF1",
    },
    coco: {
      "--color-primary": "#7C2D12",
      "--color-secondary": "#EA580C",
      "--color-accent": "#FB923C",
      "--bg-color": "#FFF7ED",
      "--text-color": "#431407",
      "--button-bg": "#7C2D12",
      "--button-text": "#FFFFFF",
      "--border-color": "#FED7AA",
      "--footer-bg": "#FFEDD5",
    },
    ocean: {
      "--color-primary": "#0369A1",
      "--color-secondary": "#0284C7",
      "--color-accent": "#0EA5E9",
      "--bg-color": "#F0F9FF",
      "--text-color": "#0C4A6E",
      "--button-bg": "#0369A1",
      "--button-text": "#FFFFFF",
      "--border-color": "#BAE6FD",
      "--footer-bg": "#E0F2FE",
    },
    forest: {
      "--color-primary": "#166534",
      "--color-secondary": "#16A34A",
      "--color-accent": "#22C55E",
      "--bg-color": "#F0FDF4",
      "--text-color": "#14532D",
      "--button-bg": "#166534",
      "--button-text": "#FFFFFF",
      "--border-color": "#BBF7D0",
      "--footer-bg": "#DCFCE7",
    },
    lavender: {
      "--color-primary": "#7C2D92",
      "--color-secondary": "#A855F7",
      "--color-accent": "#C084FC",
      "--bg-color": "#FAF5FF",
      "--text-color": "#581C87",
      "--button-bg": "#7C2D92",
      "--button-text": "#FFFFFF",
      "--border-color": "#DDD6FE",
      "--footer-bg": "#EDE9FE",
    },
    coral: {
      "--color-primary": "#E11D48",
      "--color-secondary": "#F43F5E",
      "--color-accent": "#FB7185",
      "--bg-color": "#FFF1F2",
      "--text-color": "#881337",
      "--button-bg": "#E11D48",
      "--button-text": "#FFFFFF",
      "--border-color": "#FECDD3",
      "--footer-bg": "#FFE4E6",
    },
    slate: {
      "--color-primary": "#475569",
      "--color-secondary": "#64748B",
      "--color-accent": "#94A3B8",
      "--bg-color": "#F8FAFC",
      "--text-color": "#1E293B",
      "--button-bg": "#475569",
      "--button-text": "#FFFFFF",
      "--border-color": "#CBD5E1",
      "--footer-bg": "#F1F5F9",
    },
  };

  const applyTheme = (themeName) => {
    const theme = themes[themeName];
    const root = document.documentElement;
    Object.keys(theme).forEach((key) => {
      root.style.setProperty(key, theme[key]);
    });
    document.body.style.backgroundColor = theme["--bg-color"];
  };

  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("selectedTheme") || "default";
  });

  useEffect(() => {
    applyTheme(currentTheme);
    localStorage.setItem("selectedTheme", currentTheme);
  }, [currentTheme]);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  const handleSelectTheme = (themeName) => {
    setCurrentTheme(themeName);
    setIsOpen(false);
    setIsLanguageOpen(false);
  };

  const toggleColorMenu = () => {
    setIsOpen(!isOpen);
    setIsLanguageOpen(false); // Close language menu
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
            {Object.keys(themes).map((themeName) => (
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
                      backgroundColor: themes[themeName]["--color-primary"],
                    }}
                  />
                  <div className="flex space-x-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: themes[themeName]["--color-primary"],
                      }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: themes[themeName]["--color-secondary"],
                      }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: themes[themeName]["--color-accent"],
                      }}
                    />
                  </div>
                </div>
                <span className="truncate font-medium capitalize">{t(`design.themes.${themeName}`)}</span>
                {currentTheme === themeName && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
