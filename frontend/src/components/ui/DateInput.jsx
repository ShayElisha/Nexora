/**
 * Date input with forced LTR so native dd/mm/yyyy UI doesn't break RTL forms.
 */
const DateInput = ({ className = "", style = {}, ...props }) => (
  <input
    type="date"
    dir="ltr"
    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all ${className}`}
    style={{
      borderColor: "var(--border-color)",
      backgroundColor: "var(--bg-color)",
      color: "var(--text-color)",
      direction: "ltr",
      textAlign: "left",
      ...style,
    }}
    {...props}
  />
);

export default DateInput;
