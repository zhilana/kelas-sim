const { chromium } = require("playwright");
const URL = "http://localhost:3120/";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
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

  // zoom in on the student rows using the three camera from inside
  await page.getByRole("button", { name: /^Samping$/ }).click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "/tmp/sisi.png" });

  // scroll to zoom in more
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -200); await page.waitForTimeout(120); }
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/sisi-zoom.png" });
  console.log("ok");
  await browser.close();
})();