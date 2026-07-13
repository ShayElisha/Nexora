import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const NexoraLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="11" height="11" rx="2" fill="currentColor" className="text-[var(--text-color)]" />
    <rect x="15" y="2" width="11" height="11" rx="2" fill="currentColor" opacity="0.7" className="text-[var(--text-color)]" />
    <rect x="2" y="15" width="11" height="11" rx="2" fill="currentColor" opacity="0.5" className="text-[var(--text-color)]" />
    <rect x="15" y="15" width="11" height="11" rx="2" fill="var(--color-primary)" />
  </svg>
);

const LandingHeader = ({ onSignIn, onDemo }) => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      labelKey: "landing.nav.products",
      children: [
        { labelKey: "landing.nav.erp_core", to: "/features" },
        { labelKey: "landing.nav.crm_suite", to: "/features" },
        { labelKey: "landing.nav.hr_payroll", to: "/features" },
        { labelKey: "landing.nav.inventory", to: "/features" },
      ],
    },
    { labelKey: "landing.nav.solutions", to: "/services" },
    { labelKey: "landing.nav.enterprise", to: "/about" },
    { labelKey: "landing.nav.pricing", to: "/pricing-plans" },
    { labelKey: "landing.nav.resources", to: "/docs" },
  ];

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b"
      style={{
        backgroundColor: "color-mix(in srgb, var(--bg-color) 85%, transparent)",
        borderColor: "var(--border-color)",
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <NexoraLogo />
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-color)" }}>
            Nexora
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {navItems.map((item) =>
            item.children ? (
              <li
                key={item.labelKey}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.labelKey)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors"
                  style={{ color: "var(--text-color)" }}
                >
                  {t(item.labelKey)}
                  <ChevronDown size={14} strokeWidth={2} />
                </button>
                <AnimatePresence>
                  {openDropdown === item.labelKey && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className={`absolute top-full mt-1 w-48 border rounded-xl shadow-lg py-2 ${
                        isRTL ? "right-0" : "left-0"
                      }`}
                      style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.labelKey}
                          to={child.to}
                          className="block px-4 py-2 text-sm transition-colors hover:opacity-80"
                          style={{ color: "var(--text-color)" }}
                        >
                          {t(child.labelKey)}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ) : (
              <li key={item.labelKey}>
                <Link
                  to={item.to}
                  className="px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--text-color)" }}
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            )
          )}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={onSignIn}
            className="px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--text-color)" }}
          >
            {t("landing.nav.sign_in")}
          </button>
          <button
            onClick={onDemo}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg hover:-translate-y-px transition-all duration-300"
            style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
          >
            {t("landing.nav.request_demo")}
          </button>
        </div>

        <button
          className="lg:hidden p-2"
          style={{ color: "var(--text-color)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div
          className="lg:hidden border-t px-6 py-4 space-y-1"
          style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
        >
          {navItems.map((item) =>
            item.children ? (
              <div key={item.labelKey} className="py-2">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-secondary)" }}>
                  {t(item.labelKey)}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.labelKey}
                    to={child.to}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm"
                    style={{ color: "var(--text-color)" }}
                  >
                    {t(child.labelKey)}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.labelKey}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium"
                style={{ color: "var(--text-color)" }}
              >
                {t(item.labelKey)}
              </Link>
            )
          )}
          <div className="pt-4 flex flex-col gap-2 border-t" style={{ borderColor: "var(--border-color)" }}>
            <button
              onClick={() => { setMobileOpen(false); onSignIn(); }}
              className="py-2.5 text-sm font-medium border rounded-lg"
              style={{ color: "var(--text-color)", borderColor: "var(--border-color)" }}
            >
              {t("landing.nav.sign_in")}
            </button>
            <button
              onClick={() => { setMobileOpen(false); onDemo(); }}
              className="py-2.5 text-sm font-semibold rounded-lg"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--button-text)" }}
            >
              {t("landing.nav.request_demo")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
