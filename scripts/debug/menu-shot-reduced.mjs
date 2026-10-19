import { chromium } from "playwright";
const b = await chromium.launch();
for (const [name, w, h] of [["menu-desktop-final", 1440, 900], ["menu-mobile-final", 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  await p.goto("http://localhost:3017/menu", { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `/home/jeli/.hermes/cache/scratch/${name}.png` });
  await p.close();
}
await b.close();
console.log("ok");
