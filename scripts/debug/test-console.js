const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err));

  await page.goto("http://localhost:3150/");
  await page.waitForTimeout(1000);

  console.log("clicking button");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(500);

  await browser.close();
})();