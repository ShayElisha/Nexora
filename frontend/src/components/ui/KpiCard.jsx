/**
 * Consistent KPI tile — label, value, optional badge, optional icon/currency mark.
 */
export default function KpiCard({
  label,
  value,
  badge,
  badgeColor = "var(--color-secondary)",
  icon: Icon,
  iconColor = "var(--color-primary)",
  currencySymbol,
  className = "",
  delay = 0,
}) {
  return (
    <div
      className={`rounded-xl shadow-lg p-4 ${className}`.trim()}
      style={{
        backgroundColor: "var(--bg-color)",
        border: "1px solid var(--border-color)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-4 h-full min-h-[4.5rem]">
        <div className="min-w-0 flex-1 flex flex-col gap-1 justify-center">
          <p className="text-sm leading-snug" style={{ color: "var(--color-secondary)" }}>
            {label}
          </p>
          <p className="text-2xl font-bold leading-none" style={{ color: "var(--text-color)" }}>
            {currencySymbol ? `${currencySymbol}${value}` : value}
          </p>
          {badge != null && badge !== "" ? (
            <p className="text-sm mt-1 leading-snug" style={{ color: badgeColor }}>
              {badge}
            </p>
          ) : null}
        </div>
        {currencySymbol && !Icon ? (
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-lg font-bold"
            style={{
              backgroundColor: `color-mix(in srgb, ${iconColor} 15%, transparent)`,
              color: iconColor,
            }}
            aria-hidden
          >
            {currencySymbol}
          </div>
        ) : null}
        {Icon ? (
          <Icon className="w-8 h-8 shrink-0 mt-0.5" style={{ color: iconColor }} />
        ) : null}
      </div>
    </div>
  );
}
