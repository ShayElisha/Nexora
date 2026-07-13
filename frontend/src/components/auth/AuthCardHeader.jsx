import { useTranslation } from "react-i18next";

const AuthCardHeader = ({ title, subtitle }) => {
  const { t } = useTranslation();

  return (
    <header className="text-center mb-8">
      <div className="relative inline-flex items-center justify-center mb-5">
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60 scale-125"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          }}
        />
        <div
          className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full overflow-hidden"
          style={{
            backgroundColor: "var(--surface-color)",
            boxShadow:
              "inset 0 2px 8px color-mix(in srgb, var(--text-color) 12%, transparent), 0 4px 16px color-mix(in srgb, var(--color-primary) 20%, transparent)",
          }}
        >
          <img
            src="/assets/logo.png"
            alt={t("auth.logo_alt")}
            className="h-12 w-12 object-contain"
          />
        </div>
      </div>

      <h1
        className="text-2xl sm:text-[1.65rem] font-bold tracking-tight"
        style={{ color: "var(--text-color)" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      )}
    </header>
  );
};

export default AuthCardHeader;
