import { Search } from "lucide-react";

/**
 * RTL-safe search input: icon uses logical `start` inset and
 * padding uses `ps`/`pe` so Hebrew flips the icon to the inline-start side.
 */
export default function SearchField({
  value,
  onChange,
  placeholder,
  className = "",
  inputClassName = "",
  iconClassName = "text-[var(--color-secondary,#9ca3af)]",
  style,
  ...props
}) {
  return (
    <div className={`relative ${className}`.trim()}>
      <Search
        className={`pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 ${iconClassName}`.trim()}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border py-2 ps-10 pe-4 focus:outline-none focus:ring-2 transition-all ${inputClassName}`.trim()}
        style={style}
        {...props}
      />
    </div>
  );
}
