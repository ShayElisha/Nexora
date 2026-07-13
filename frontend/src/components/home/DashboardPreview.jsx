const DashboardPreview = ({ theme }) => (
  <div
    className="w-full h-full overflow-hidden transition-all duration-500 ease-out"
    style={{
      backgroundColor: theme.bg,
      color: theme.text,
      borderRadius: theme.radius,
    }}
  >
    <div className="flex h-full min-h-[320px]">
      <aside
        className="w-14 shrink-0 border-r p-2 space-y-2 transition-all duration-500"
        style={{ backgroundColor: theme.sidebar, borderColor: theme.border }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 rounded transition-all duration-500"
            style={{
              backgroundColor: i === 1 ? theme.accent : theme.surface,
              borderRadius: theme.radius,
              opacity: i === 1 ? 1 : 0.6,
            }}
          />
        ))}
      </aside>

      <div className="flex-1 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: theme.muted }}>
              Revenue Overview
            </p>
            <p className="text-lg font-bold" style={{ color: theme.text }}>$2.4M</p>
          </div>
          <span
            className="text-[10px] px-2 py-1 font-semibold transition-all duration-500"
            style={{ backgroundColor: `${theme.accent2}22`, color: theme.accent2, borderRadius: theme.radius }}
          >
            +18.2%
          </span>
        </div>

        <div
          className="h-24 flex items-end gap-1.5 p-3 border transition-all duration-500"
          style={{ backgroundColor: theme.surface, borderColor: theme.border, borderRadius: theme.radius }}
        >
          {theme.chart.map((color, i) => (
            <div
              key={i}
              className="flex-1 transition-all duration-500"
              style={{
                height: `${40 + i * 18}%`,
                backgroundColor: color,
                borderRadius: theme.radius,
              }}
            />
          ))}
        </div>

        <div
          className="border transition-all duration-500 overflow-hidden"
          style={{ borderColor: theme.border, borderRadius: theme.radius }}
        >
          {["Acme Corp", "Vertex Ltd", "Nova Systems"].map((row, i) => (
            <div
              key={row}
              className="flex items-center justify-between px-3 py-2 text-[10px] border-b last:border-0 transition-all duration-500"
              style={{ borderColor: theme.border, backgroundColor: i % 2 === 0 ? theme.surface : theme.bg }}
            >
              <span style={{ color: theme.text }}>{row}</span>
              <span style={{ color: theme.accent }}>Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardPreview;
