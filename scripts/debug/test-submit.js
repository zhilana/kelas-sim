const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto("http://localhost:3150/");
  await page.waitForTimeout(500);

  // Check form submit
  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (form) form.requestSubmit();
  });
  await page.waitForTimeout(500);

  const stageButtons = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button")).map((b) => b.textContent.trim())
  );
  console.log("stageButtons:", stageButtons);
  await browser.close();
})();