export const DESIGN_THEMES = {
  default: {
    "--color-primary": "#2563EB",
    "--color-secondary": "#64748B",
    "--color-accent": "#059669",
    "--bg-color": "#FFFFFF",
    "--text-color": "#0F172A",
    "--button-bg": "#2563EB",
    "--button-text": "#FFFFFF",
    "--border-color": "#E2E8F0",
    "--footer-bg": "#F8FAFC",
  },
  royal: {
    "--color-primary": "#7C3AED",
    "--color-secondary": "#A855F7",
    "--color-accent": "#EC4899",
    "--bg-color": "#FEFBFF",
    "--text-color": "#1E1B4B",
    "--button-bg": "#7C3AED",
    "--button-text": "#FFFFFF",
    "--border-color": "#E9D5FF",
    "--footer-bg": "#F3E8FF",
  },
  opulent: {
    "--color-primary": "#DC2626",
    "--color-secondary": "#F59E0B",
    "--color-accent": "#059669",
    "--bg-color": "#FFFBEB",
    "--text-color": "#451A03",
    "--button-bg": "#DC2626",
    "--button-text": "#FFFFFF",
    "--border-color": "#FED7AA",
    "--footer-bg": "#FEF3C7",
  },
  elegant: {
    "--color-primary": "#374151",
    "--color-secondary": "#6B7280",
    "--color-accent": "#9CA3AF",
    "--bg-color": "#FAFAFA",
    "--text-color": "#111827",
    "--button-bg": "#374151",
    "--button-text": "#FFFFFF",
    "--border-color": "#E5E7EB",
    "--footer-bg": "#F3F4F6",
  },
  modern: {
    "--color-primary": "#0EA5E9",
    "--color-secondary": "#06B6D4",
    "--color-accent": "#10B981",
    "--bg-color": "#FFFFFF",
    "--text-color": "#0F172A",
    "--button-bg": "#0EA5E9",
    "--button-text": "#FFFFFF",
    "--border-color": "#E0F2FE",
    "--footer-bg": "#F0F9FF",
  },
  vintage: {
    "--color-primary": "#92400E",
    "--color-secondary": "#B45309",
    "--color-accent": "#D97706",
    "--bg-color": "#FFFBEB",
    "--text-color": "#451A03",
    "--button-bg": "#92400E",
    "--button-text": "#FFFFFF",
    "--border-color": "#FED7AA",
    "--footer-bg": "#FEF3C7",
  },
  midnight: {
    "--color-primary": "#3B82F6",
    "--color-secondary": "#6366F1",
    "--color-accent": "#8B5CF6",
    "--bg-color": "#0F172A",
    "--text-color": "#F1F5F9",
    "--button-bg": "#3B82F6",
    "--button-text": "#FFFFFF",
    "--border-color": "#334155",
    "--footer-bg": "#1E293B",
  },
  neon: {
    "--color-primary": "#00F5FF",
    "--color-secondary": "#FF00FF",
    "--color-accent": "#00FF00",
    "--bg-color": "#0A0A0A",
    "--text-color": "#FFFFFF",
    "--button-bg": "#00F5FF",
    "--button-text": "#0A0A0A",
    "--border-color": "#FF00FF",
    "--footer-bg": "#1A1A1A",
  },
  sunsetGold: {
    "--color-primary": "#D97706",
    "--color-secondary": "#F59E0B",
    "--color-accent": "#FCD34D",
    "--bg-color": "#FFFBEB",
    "--text-color": "#451A03",
    "--button-bg": "#D97706",
    "--button-text": "#FFFFFF",
    "--border-color": "#FED7AA",
    "--footer-bg": "#FEF3C7",
  },
  glacier: {
    "--color-primary": "#0F766E",
    "--color-secondary": "#14B8A6",
    "--color-accent": "#5EEAD4",
    "--bg-color": "#F0FDFA",
    "--text-color": "#134E4A",
    "--button-bg": "#0F766E",
    "--button-text": "#FFFFFF",
    "--border-color": "#99F6E4",
    "--footer-bg": "#CCFBF1",
  },
  coco: {
    "--color-primary": "#7C2D12",
    "--color-secondary": "#EA580C",
    "--color-accent": "#FB923C",
    "--bg-color": "#FFF7ED",
    "--text-color": "#431407",
    "--button-bg": "#7C2D12",
    "--button-text": "#FFFFFF",
    "--border-color": "#FED7AA",
    "--footer-bg": "#FFEDD5",
  },
  ocean: {
    "--color-primary": "#0369A1",
    "--color-secondary": "#0284C7",
    "--color-accent": "#0EA5E9",
    "--bg-color": "#F0F9FF",
    "--text-color": "#0C4A6E",
    "--button-bg": "#0369A1",
    "--button-text": "#FFFFFF",
    "--border-color": "#BAE6FD",
    "--footer-bg": "#E0F2FE",
  },
  forest: {
    "--color-primary": "#166534",
    "--color-secondary": "#16A34A",
    "--color-accent": "#22C55E",
    "--bg-color": "#F0FDF4",
    "--text-color": "#14532D",
    "--button-bg": "#166534",
    "--button-text": "#FFFFFF",
    "--border-color": "#BBF7D0",
    "--footer-bg": "#DCFCE7",
  },
  lavender: {
    "--color-primary": "#7C2D92",
    "--color-secondary": "#A855F7",
    "--color-accent": "#C084FC",
    "--bg-color": "#FAF5FF",
    "--text-color": "#581C87",
    "--button-bg": "#7C2D92",
    "--button-text": "#FFFFFF",
    "--border-color": "#DDD6FE",
    "--footer-bg": "#EDE9FE",
  },
  coral: {
    "--color-primary": "#E11D48",
    "--color-secondary": "#F43F5E",
    "--color-accent": "#FB7185",
    "--bg-color": "#FFF1F2",
    "--text-color": "#881337",
    "--button-bg": "#E11D48",
    "--button-text": "#FFFFFF",
    "--border-color": "#FECDD3",
    "--footer-bg": "#FFE4E6",
  },
  slate: {
    "--color-primary": "#475569",
    "--color-secondary": "#64748B",
    "--color-accent": "#94A3B8",
    "--bg-color": "#F8FAFC",
    "--text-color": "#1E293B",
    "--button-bg": "#475569",
    "--button-text": "#FFFFFF",
    "--border-color": "#CBD5E1",
    "--footer-bg": "#F1F5F9",
  },
};

export const notifyThemeChange = (themeName) => {
  window.dispatchEvent(
    new CustomEvent("nexora-theme-change", { detail: themeName })
  );
};

export const applyDesignTheme = (themeName) => {
  const theme = DESIGN_THEMES[themeName];
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.style.setProperty(
    "--surface-color",
    theme["--footer-bg"] || theme["--bg-color"]
  );
  root.style.setProperty("--text-muted", theme["--color-secondary"]);
  root.style.setProperty("--radius", "10px");
  root.style.setProperty(
    "--shadow",
    `0 24px 48px -12px color-mix(in srgb, ${theme["--text-color"]} 14%, transparent), 0 0 0 1px color-mix(in srgb, ${theme["--border-color"]} 70%, transparent)`
  );
  document.body.style.backgroundColor = theme["--bg-color"];
};

export const getStoredTheme = () =>
  localStorage.getItem("selectedTheme") || "default";

export const setStoredTheme = (themeName) => {
  localStorage.setItem("selectedTheme", themeName);
};

export const cssVarsToPreview = (vars) => ({
  bg: vars["--bg-color"],
  surface: vars["--footer-bg"],
  text: vars["--text-color"],
  muted: vars["--color-secondary"],
  accent: vars["--color-primary"],
  accent2: vars["--color-accent"],
  border: vars["--border-color"],
  radius: "12px",
  sidebar: vars["--footer-bg"],
  chart: [vars["--color-primary"], vars["--color-secondary"], vars["--color-accent"]],
});
