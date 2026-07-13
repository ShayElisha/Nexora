import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { applyDesignTheme, getStoredTheme } from "../../lib/designThemes";

export const RTL_LANGUAGES = ["he", "ar"];

export function useLanding() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = RTL_LANGUAGES.includes(i18n.language);
  const fontClass = i18n.language === "he" ? "font-hebrew" : "font-sans";

  useEffect(() => {
    applyDesignTheme(getStoredTheme());
  }, []);

  const goSignIn = () => navigate("/login");
  const goTrial = () => navigate("/create-company");
  const goExpert = () => navigate("/contact");

  return { isRTL, fontClass, goSignIn, goTrial, goExpert, i18n };
}
