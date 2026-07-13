const LandingSection = ({
  children,
  className = "",
  id,
  alt = false,
  tight = false,
}) => (
  <section
    id={id}
    className={`${tight ? "py-12 md:py-16" : "py-16 md:py-24"} ${className}`}
    style={{
      backgroundColor: alt ? "var(--footer-bg)" : "var(--bg-color)",
    }}
  >
    <div className="max-w-7xl mx-auto px-6">{children}</div>
  </section>
);

export const SectionHeading = ({ eyebrow, title, subtitle, centered = true }) => (
  <div className={`mb-12 md:mb-16 ${centered ? "text-center max-w-3xl mx-auto" : ""}`}>
    {eyebrow && (
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-3"
        style={{ color: "var(--color-primary)" }}
      >
        {eyebrow}
      </p>
    )}
    {title && (
      <h2
        className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
        style={{ color: "var(--text-color)" }}
      >
        {title}
      </h2>
    )}
    {subtitle && (
      <p className="text-lg leading-relaxed" style={{ color: "var(--color-secondary)" }}>
        {subtitle}
      </p>
    )}
  </div>
);

export default LandingSection;
