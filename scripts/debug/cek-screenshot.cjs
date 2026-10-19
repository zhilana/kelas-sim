/* Ambil screenshot state peringatan (dark) & state normal (light) untuk QA visual */
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.goto("http://127.0.0.1:3017/", { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll("[data-kata], [data-reveal]")).length > 0 &&
      Array.from(document.querySelectorAll("[data-kata], [data-reveal]"))
        .every((e) => getComputedStyle(e).opacity === "1"),
    null,
    { timeout: 25000 },
  );
  await page.getByText("Mulai Simulasi").first().click();
  await page.waitForTimeout(600);

  // state peringatan (dark)
  await page.locator('input[type="number"]').nth(3).fill("60");
  await page.locator('input[type="number"]').nth(4).fill("60");
  await page.waitForTimeout(900);
  await page.screenshot({ path: "peringatan-dark.png", fullPage: true });
  const denah = page.locator('svg[aria-label="Denah ruangan dari atas"]');
  await denah.screenshot({ path: "denah-tabrakan.png" });

  // terapkan saran lebar -> aman lagi, tetap dark
  await page.getByRole("button", { name: /Perluas lebar/ }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: "aman-dark.png", fullPage: true });

  await browser.close();
  console.log("CAPTURE-SELESAI");
})();
