import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applyDesignTheme, getStoredTheme } from "../../lib/designThemes";
import AuthCanvas from "../../components/auth/AuthCanvas";
import AuthCard from "../../components/auth/AuthCard";

const LoginPage = () => {
  const { i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  useEffect(() => {
    applyDesignTheme(getStoredTheme());
  }, []);

  return (
    <div
      className={isRTL ? "font-hebrew" : "font-sans"}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <AuthCanvas>
        <AuthCard defaultIsLogin />
      </AuthCanvas>
    </div>
  );
};

export default LoginPage;
