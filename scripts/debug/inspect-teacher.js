const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
  await page.goto("http://localhost:3120/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Click submit to generate classroom
  const submitBtn = page.locator('button[type="submit"]');
  if (await submitBtn.count()) {
    await submitBtn.click();
    await page.waitForTimeout(1500);
  }

  // Close popup if present
  const tutup = page.getByRole("button", { name: /Lihat kelasnya/i });
  if (await tutup.count()) await tutup.click();
  await page.waitForTimeout(500);

  const sceneInfo = await page.evaluate(() => {
    if (typeof window.__kelasScene === "function") {
      return window.__kelasScene();
    }
    return "no __kelasScene";
  });
  console.log("sceneInfo:", JSON.stringify(sceneInfo));

  await page.screenshot({ path: "/tmp/current-scene.png" });
  console.log("Screenshot taken");
  await browser.close();
})();