import EmptyState from "./EmptyState";

/**
 * Table shell that hides headers when empty and shows a centered empty state.
 * Prefer this over header-row + detached empty card.
 */
export default function DataTable({
  columns = [],
  rows = [],
  isEmpty,
  emptyIcon,
  emptyTitle = "No records found",
  emptyDescription,
  emptyAction,
  className = "",
  tableClassName = "w-full",
  headStyle,
  renderRow,
}) {
  const empty = typeof isEmpty === "boolean" ? isEmpty : !rows?.length;

  if (empty) {
    return (
      <div className={`rounded-xl overflow-hidden ${className}`.trim()}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <table className={tableClassName}>
        <thead style={headStyle}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                className={`py-3 px-4 font-semibold text-start ${col.className || ""}`}
                style={{ color: "var(--text-color)", ...(col.style || {}) }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map((row, index) => renderRow(row, index))}</tbody>
      </table>
    </div>
  );
}
