import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { applyDesignTheme, getStoredTheme } from "../lib/designThemes";
import LandingHeader from "../components/home/LandingHeader";
import HeroSection from "../components/home/HeroSection";
import ValuePillars from "../components/home/ValuePillars";
import ProductModules from "../components/home/ProductModules";
import TestimonialsSection from "../components/home/TestimonialsSection";
import StatsSection from "../components/home/StatsSection";
import TrustSection from "../components/home/TrustSection";
import ProcessSection from "../components/home/ProcessSection";
import ThemePlayground from "../components/home/ThemePlayground";
import FinalCTA from "../components/home/FinalCTA";
import IntegrationsBar from "../components/home/IntegrationsBar";
import LandingFooter from "../components/home/LandingFooter";

const HomePage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  useEffect(() => {
    applyDesignTheme(getStoredTheme());
  }, []);

  const goSignIn = () => navigate("/login");
  const goTrial = () => navigate("/create-company");
  const goExpert = () => navigate("/contact");

  return (
    <div
      className={`min-h-screen antialiased ${isRTL ? "font-hebrew" : "font-sans"}`}
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <LandingHeader onSignIn={goSignIn} onDemo={goExpert} />
      <main>
        <HeroSection onTrial={goTrial} onExpert={goExpert} />
        <ValuePillars />
        <StatsSection />
        <ProductModules />
        <TrustSection />
        <ProcessSection />
        <TestimonialsSection />
        <ThemePlayground />
        <FinalCTA onSignUp={goTrial} onLogin={goSignIn} />
        <IntegrationsBar />
      </main>
      <LandingFooter />
    </div>
  );
};

export default HomePage;
