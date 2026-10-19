/* Debug 5: hitung berapa kali effect main & pantau settling */
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.goto("http://127.0.0.1:3017/", { waitUntil: "networkidle" });
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(1000);
    const v = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("[data-kata], [data-reveal]"));
      const op = el.map((e) => Number(getComputedStyle(e).opacity).toFixed(2));
      const nodes = document.querySelectorAll("nav [data-reveal]").length;
      const btnIds = Array.from(document.querySelectorAll("nav [data-reveal]")).map((b) => b.textContent.slice(0, 2));
      return { runs: window.__runs, nodes, btnIds, op: op.join(" ") };
    });
    console.log(`t=${i + 1}s runs=${v.runs} navBtn=${v.nodes}`, JSON.stringify(v.btnIds), v.op);
  }
  await browser.close();
})();
