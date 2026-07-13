import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { applyDesignTheme, getStoredTheme } from "../../lib/designThemes";
import { usePageLocale } from "../../hooks/usePageLocale";
import LandingHeader from "./LandingHeader";
import LandingFooter from "./LandingFooter";

const PublicPageLayout = ({ children }) => {
  const navigate = useNavigate();
  const { isRTL } = usePageLocale();

  useEffect(() => {
    applyDesignTheme(getStoredTheme());
  }, []);

  return (
    <div
      className={`min-h-screen antialiased ${isRTL ? "font-hebrew" : "font-sans"}`}
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <LandingHeader
        onSignIn={() => navigate("/login")}
        onDemo={() => navigate("/contact")}
      />
      <main className="nx-page-shell nx-page-shell--public">{children}</main>
      <LandingFooter />
    </div>
  );
};

export default PublicPageLayout;
