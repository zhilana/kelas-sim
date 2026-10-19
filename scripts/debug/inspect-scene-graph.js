const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto("http://localhost:3150/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1000);
  const tutup = page.getByRole("button", { name: /Lihat kelasnya/i });
  if (await tutup.count()) await tutup.click();

  const details = await page.evaluate(() => {
    // Traverse scene
    const res = { meshes: [] };
    // Let's find window.__kelasScene
    return window.__kelasScene();
  });
  console.log("details:", details);
  await browser.close();
})();