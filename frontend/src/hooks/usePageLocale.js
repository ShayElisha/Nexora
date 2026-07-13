import { useTranslation } from "react-i18next";

export const usePageLocale = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  return { t, i18n, isRTL, lang: i18n.language };
};
