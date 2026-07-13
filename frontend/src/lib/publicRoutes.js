/** Shared public marketing routes — hide default Navbar/Footer when unauthenticated */
export const PUBLIC_MARKETING_ROUTES = [
  "/",
  "/features",
  "/services",
  "/contact",
  "/security",
  "/integrations",
  "/api",
  "/about",
  "/careers",
  "/blog",
  "/customers",
  "/partners",
  "/help",
  "/docs",
  "/status",
  "/report",
  "/terms",
  "/privacy",
  "/cookies",
  "/pricing-plans",
  "/login",
  "/signup",
  "/create-company",
  "/forgot-password",
  "/reset-password",
];

export const isPublicMarketingRoute = (pathname) =>
  PUBLIC_MARKETING_ROUTES.includes(pathname);
