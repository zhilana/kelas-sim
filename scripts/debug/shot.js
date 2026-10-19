const { chromium } = require("playwright");
const URL = "http://localhost:3120/";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
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

  for (const view of ["Depan", "Atas", "Dalam", "Orbit"]) {
    const b = page.getByRole("button", { name: new RegExp("^" + view + "$") });
    if (await b.count()) { await b.first().click(); await page.waitForTimeout(1800); }
    await page.screenshot({ path: `/tmp/kelas-${view}.png` });
  }
  console.log("ok");
  await browser.close();
})();