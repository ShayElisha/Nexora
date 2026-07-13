import LandingHeader from "../home/LandingHeader";
import LandingFooter from "../home/LandingFooter";
import { useLanding } from "./useLanding";

const LandingPageShell = ({ children, showHeader = true, showFooter = true }) => {
  const { isRTL, fontClass, goSignIn, goExpert } = useLanding();

  return (
    <div
      className={`min-h-screen antialiased ${fontClass}`}
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {showHeader && <LandingHeader onSignIn={goSignIn} onDemo={goExpert} />}
      <main>{children}</main>
      {showFooter && <LandingFooter />}
    </div>
  );
};

export default LandingPageShell;
