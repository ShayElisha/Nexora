const AuthSurface = ({ children, wide = false, className = "", dir }) => (
  <div
    className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${
      wide ? "max-w-3xl" : "max-w-[420px]"
    } ${className}`}
    style={{
      backgroundColor: "var(--surface-color)",
      borderRadius: "var(--radius)",
      boxShadow: "var(--shadow)",
    }}
    dir={dir}
  >
    <div
      className="h-1"
      style={{
        background:
          "linear-gradient(to right, var(--color-primary), var(--color-accent))",
      }}
    />
    {children}
  </div>
);

export default AuthSurface;
