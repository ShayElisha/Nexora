/**
 * Centered empty state for lists/tables/charts.
 */
const EmptyState = ({
  icon: Icon,
  title = "No records found",
  description,
  action,
  compact = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${
      compact ? "py-10 px-4" : "py-16 px-6"
    }`}
  >
    {Icon ? (
      <div
        className="mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-primary) 12%, var(--bg-color))",
          color: "var(--color-primary)",
        }}
      >
        <Icon className="w-7 h-7" strokeWidth={1.75} />
      </div>
    ) : null}
    <p
      className="text-base font-semibold mb-1"
      style={{ color: "var(--text-color)" }}
    >
      {title}
    </p>
    {description ? (
      <p
        className="text-sm max-w-sm"
        style={{ color: "var(--color-secondary)" }}
      >
        {description}
      </p>
    ) : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

/**
 * Empty row that spans a table — use instead of header + detached empty card.
 */
export const EmptyTableRow = ({ colSpan = 1, ...props }) => (
  <tr>
    <td colSpan={colSpan} className="border-0">
      <EmptyState {...props} compact />
    </td>
  </tr>
);

export default EmptyState;
