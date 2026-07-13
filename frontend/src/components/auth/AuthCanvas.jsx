const AuthCanvas = ({ children, align = "center", className = "" }) => (
  <div
    className={`relative min-h-screen flex ${
      align === "start" ? "items-start" : "items-center"
    } justify-center px-4 sm:px-6 py-12 overflow-hidden ${className}`}
    style={{ backgroundColor: "var(--bg-color)" }}
  >
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute -top-32 -start-32 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 55%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-40 -end-40 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-35"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 50%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/4 -end-24 h-64 w-64 rounded-full blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-secondary) 45%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 -start-20 h-56 w-56 rounded-full blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 35%, transparent) 0%, transparent 70%)",
        }}
      />
    </div>

    <div className="relative z-10 w-full flex justify-center">{children}</div>
  </div>
);

export default AuthCanvas;
