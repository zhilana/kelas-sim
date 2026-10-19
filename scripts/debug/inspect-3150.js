const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto("http://localhost:3150/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Click calculate & generate 3D class
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1000);

  // Close popup
  const tutup = page.getByRole("button", { name: /Lihat kelasnya/i });
  if (await tutup.count()) await tutup.click();
  await page.waitForTimeout(500);

  // Let's inspect the teacher and students position and colors via window.__kelasScene
  const sceneData = await page.evaluate(() => {
    if (typeof window.__kelasScene === "function") {
      return window.__kelasScene();
    }
    return null;
  });
  console.log("sceneData:", sceneData);

  // Take screenshot of Depan, Orbit, and zoom in on teacher
  await page.screenshot({ path: "/tmp/current-3150-orbit.png" });

  await page.getByRole("button", { name: /^Depan$/ }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/current-3150-depan.png" });

  await browser.close();
  console.log("Screenshots captured successfully");
})();