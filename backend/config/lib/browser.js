// Cross-environment headless browser launcher.
//
// Locally (and on a normal VM) we use the full `puppeteer` package which ships
// its own Chromium. On Vercel / AWS Lambda the bundled Chromium is too large
// for the serverless bundle, so we use `puppeteer-core` together with the
// lightweight `@sparticuz/chromium` binary.
//
// Usage:
//   const browser = await launchBrowser();
//   ... browser.newPage() ...
//   await browser.close();

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION
);

export const launchBrowser = async () => {
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;

    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
};
