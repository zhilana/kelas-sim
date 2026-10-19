const { chromium } = require("playwright");
const URL = "http://localhost:3120/";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() =>
    document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")),
  );
  await page.waitForTimeout(250);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
  const t = page.getByRole("button", { name: /Lihat kelasnya/i });
  if (await t.count()) await t.click();
  await page.waitForTimeout(600);

  await page.getByRole("button", { name: /^Depan$/ }).click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "/tmp/guru-depan.png" });

  // zoom ke pojok guru
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.35);
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, -200); await page.waitForTimeout(100); }
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/guru-zoom.png" });
  console.log("ok");
  await browser.close();
})();