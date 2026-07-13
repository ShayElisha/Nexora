import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  DESIGN_THEMES,
  applyDesignTheme,
  cssVarsToPreview,
  getStoredTheme,
  setStoredTheme,
  notifyThemeChange,
} from "../../lib/designThemes";
import DashboardPreview from "./DashboardPreview";

const ThemePlayground = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [active, setActive] = useState(getStoredTheme);

  useEffect(() => {
    const onThemeChange = (e) => setActive(e.detail);
    window.addEventListener("nexora-theme-change", onThemeChange);
    return () => window.removeEventListener("nexora-theme-change", onThemeChange);
  }, []);

  const selectTheme = (themeName) => {
    setActive(themeName);
    applyDesignTheme(themeName);
    setStoredTheme(themeName);
    notifyThemeChange(themeName);
  };

  const preview = cssVarsToPreview(DESIGN_THEMES[active] || DESIGN_THEMES.default);

  return (
    <section
      className="py-24 border-y"
      style={{ backgroundColor: "var(--footer-bg)", borderColor: "var(--border-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            style={{ color: "var(--text-color)" }}
          >
            {t("landing.theme_section.title")}
          </h2>
          <p className="max-w-2xl mx-auto" style={{ color: "var(--color-secondary)" }}>
            {t("landing.theme_section.subtitle")}
          </p>
        </motion.div>

        <div className={`grid lg:grid-cols-[280px_1fr] gap-6 items-start ${isRTL ? "direction-rtl" : ""}`}>
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 16 : -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="backdrop-blur-xl border rounded-2xl p-5 shadow-sm lg:sticky lg:top-24"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--color-secondary)" }}
            >
              {t("landing.theme_section.panel_label")}
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {Object.keys(DESIGN_THEMES).map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => selectTheme(themeName)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isRTL ? "text-right flex-row-reverse" : "text-left"
                  }`}
                  style={
                    active === themeName
                      ? {
                          backgroundColor: "var(--color-primary)",
                          color: "var(--button-text)",
                        }
                      : { color: "var(--text-color)" }
                  }
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: DESIGN_THEMES[themeName]["--color-primary"] }}
                  />
                  <span className="truncate">{t(`design.themes.${themeName}`)}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <p className="text-xs text-center" style={{ color: "var(--color-secondary)" }}>
              {t("landing.theme_section.preview_hint")}
            </p>
            <div
              className="border rounded-2xl overflow-hidden shadow-lg p-1"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-color)" }}
            >
              <DashboardPreview theme={preview} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ThemePlayground;
