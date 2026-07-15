/**
 * Public app base URLs for Stripe redirects, emails, and invite links.
 * Prefer CLIENT_URL / FRONTEND_URL from the host env (Vercel), never hardcode localhost in callers.
 */
export function getFrontendUrl() {
  const url =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_BASE_URL ||
    "http://localhost:5173";

  return String(url).replace(/\/$/, "");
}

export function getApiUrl() {
  const url =
    process.env.NEXORA_API_URL ||
    process.env.API_URL ||
    "http://localhost:5000";

  return String(url).replace(/\/$/, "");
}
