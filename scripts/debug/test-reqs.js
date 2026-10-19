const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      console.log("FAILED REQ:", res.status(), res.url());
    }
  });
  await page.goto("http://localhost:3150/");
  await page.waitForTimeout(1000);
  await browser.close();
})();