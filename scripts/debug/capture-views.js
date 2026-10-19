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

  // Position camera directly in front of teacher's desk!
  const res = await page.evaluate(() => {
    const scene = window.__kelasSceneInternal; // Let's check if we can get R
    // Or let's inspect G.orang
    return null;
  });

  // Let's take a screenshot from Samping view or Orbit view
  await page.getByRole("button", { name: /^Dalam$/ }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/view-dalam.png" });

  await page.getByRole("button", { name: /^Atas$/ }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/view-atas.png" });

  await browser.close();
  console.log("done");
})();