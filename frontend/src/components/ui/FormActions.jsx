import { Loader2 } from "lucide-react";

/**
 * Standardized primary + secondary action row for forms.
 * Equal height/padding; primary is filled, secondary is outline.
 */
const FormActions = ({
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  submitIcon: SubmitIcon,
  cancelIcon: CancelIcon,
  className = "",
  sticky = false,
}) => {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-6 mt-2 border-t ${className}`}
      style={{ borderColor: "var(--border-color)" }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-90 disabled:opacity-50"
        style={{
          backgroundColor: "transparent",
          color: "var(--text-color)",
          borderColor: "var(--border-color)",
        }}
      >
        {CancelIcon ? <CancelIcon className="w-4 h-4" /> : null}
        {cancelLabel}
      </button>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all hover:opacity-90 disabled:opacity-50"
        style={{
          backgroundColor: "var(--color-primary)",
          color: "var(--button-text)",
        }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : SubmitIcon ? (
          <SubmitIcon className="w-4 h-4" />
        ) : null}
        {submitLabel}
      </button>
    </div>
  );
};

/**
 * Lightweight inline add action — must not compete with page-level submit.
 */
export const InlineAddButton = ({
  onClick,
  label = "Add",
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
    style={{
      backgroundColor: "transparent",
      color: "var(--color-primary)",
      borderColor: "var(--border-color)",
    }}
  >
    <span aria-hidden>+</span>
    {label}
  </button>
);

export default FormActions;
