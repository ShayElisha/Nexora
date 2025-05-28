import React, { useEffect, useState, useRef } from "react";
import { FaPalette } from "react-icons/fa";

const DesignBox = ({ setIsLanguageOpen, isRTL }) => {
  const themes = {
    default: {
      "--color-primary": "#1D4ED8",
      "--color-secondary": "#6B7280",
      "--color-accent": "#10B981",
      "--bg-color": "#F9FAFB",
      "--text-color": "#111827",
      "--button-bg": "#1D4ED8",
      "--button-text": "#FFFFFF",
      "--border-color": "#E5E7EB",
      "--footer-bg": "#F3F4F6",
    },
    royal: {
      "--color-primary": "#283593",
      "--color-secondary": "#9C27B0",
      "--color-accent": "#FFC107",
      "--bg-color": "#FFFFFF",
      "--text-color": "#212121",
      "--button-bg": "#283593",
      "--button-text": "#FFFFFF",
      "--border-color": "#E0E0E0",
      "--footer-bg": "#F5F5F5",
    },
    opulent: {
      "--color-primary": "#800020",
      "--color-secondary": "#FFEB62",
      "--color-accent": "#556B2F",
      "--bg-color": "#FFF8E1",
      "--text-color": "#3E2723",
      "--button-bg": "#800020",
      "--button-text": "#FFFFFF",
      "--border-color": "#BCAAA4",
      "--footer-bg": "#FBE9E7",
    },
    elegant: {
      "--color-primary": "#424242",
      "--color-secondary": "#757575",
      "--color-accent": "#9E9E9E",
      "--bg-color": "#FAFAFA",
      "--text-color": "#212121",
      "--button-bg": "#424242",
      "--button-text": "#FFFFFF",
      "--border-color": "#E0E0E0",
      "--footer-bg": "#F5F5F5",
    },
    modern: {
      "--color-primary": "#1976D2",
      "--color-secondary": "#0288D1",
      "--color-accent": "#00ACC1",
      "--bg-color": "#FFFFFF",
      "--text-color": "#212121",
      "--button-bg": "#1976D2",
      "--button-text": "#FFFFFF",
      "--border-color": "#E0E0E0",
      "--footer-bg": "#F1F1F1",
    },
    vintage: {
      "--color-primary": "#6D4C41",
      "--color-secondary": "#8D6E63",
      "--color-accent": "#FFB74D",
      "--bg-color": "#FFF3E0",
      "--text-color": "#3E2723",
      "--button-bg": "#6D4C41",
      "--button-text": "#FFFFFF",
      "--border-color": "#D7CCC8",
      "--footer-bg": "#FBE9E7",
    },
    midnight: {
      "--color-primary": "#0D47A1",
      "--color-secondary": "#1565C0",
      "--color-accent": "#1976D2",
      "--bg-color": "#121212",
      "--text-color": "#E0E0E0",
      "--button-bg": "#0D47A1",
      "--button-text": "#FFFFFF",
      "--border-color": "#424242",
      "--footer-bg": "#1E1E1E",
    },
    neon: {
      "--color-primary": "#00FFDD",
      "--color-secondary": "#FF10F0",
      "--color-accent": "#7B42F6",
      "--bg-color": "#0A0A0B",
      "--text-color": "#FFFFFF",
      "--button-bg": "#00FFDD",
      "--button-text": "#0A0A0B",
      "--border-color": "#7B42F6",
      "--footer-bg": "#0F0F11",
    },
    sunsetGold: {
      "--color-primary": "#8E7D6B",
      "--color-secondary": "#D9BF77",
      "--color-accent": "#F4EAD5",
      "--bg-color": "#FFFDF9",
      "--text-color": "#2D2D2D",
      "--button-bg": "#8E7D6B",
      "--button-text": "#FFFFFF",
      "--border-color": "#E8E2D9",
      "--footer-bg": "#F5F3EF",
    },
    glacier: {
      "--color-primary": "#5f1a35",
      "--color-secondary": "#ccbbae",
      "--color-accent": "#a04e6a",
      "--bg-color": "#f8f5f2",
      "--text-color": "#2d1b1b",
      "--button-bg": "#5f1a35",
      "--button-text": "#ffffff",
      "--border-color": "#ccbbae",
      "--footer-bg": "#3b0f21",
    },
    coco: {
      "--color-primary": "#5F1A35",
      "--color-secondary": "#CCBBAE",
      "--color-accent": "#8B5E73",
      "--bg-color": "#F5EDED",
      "--text-color": "#2E0D1B",
      "--button-bg": "#5F1A35",
      "--button-text": "#FFFFFF",
      "--border-color": "#A68F83",
      "--footer-bg": "#3b0f21",
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
      className={`absolute top-32 ${isRTL ? "left-4" : "right-4"} `}
      ref={containerRef}
    >
      <button
        onClick={toggleColorMenu}
        className="p-2 bg-primary text-button-text rounded-full shadow-sm hover:shadow-md transition-all duration-200"
      >
        <FaPalette className="w-5 h-5" />
      </button>
      {isOpen && (
        <div
          className={`absolute ${
            isRTL ? "left-0" : "right-0"
          } top-full mt-1 bg-white shadow-2xl rounded-xl w-48 sm:w-56 xl:w-64 max-h-64 overflow-y-auto border border-border-color animate-slide-down z-[1000]`}
        >
          <h3 className="text-lg font-bold px-4 py-2">בחר פלטת עיצובים</h3>
          <div className="flex flex-col">
            {Object.keys(themes).map((themeName) => (
              <button
                key={themeName}
                onClick={() => handleSelectTheme(themeName)}
                className={`flex items-center px-4 py-2 text-text hover:bg-accent hover:text-button-text w-full ${
                  isRTL ? "text-right" : "text-left"
                } text-sm sm:text-base xl:text-lg transition-all duration-200`}
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 ${
                    isRTL ? "ml-2" : "mr-2"
                  } rounded-full shadow-sm`}
                  style={{
                    backgroundColor: themes[themeName]["--color-primary"],
                  }}
                />
                <span className="truncate">{themeName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignBox;
