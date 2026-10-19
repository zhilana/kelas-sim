const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto("http://localhost:3150/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1000);
  const tutup = page.getByRole("button", { name: /Lihat kelasnya/i });
  if (await tutup.count()) await tutup.click();
  await page.waitForTimeout(500);

  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button")).map((b) => b.textContent.trim())
  );
  console.log("buttons:", buttons);
  await browser.close();
})();