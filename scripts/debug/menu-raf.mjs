import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3017/menu", { waitUntil: "networkidle" });
const r = await p.evaluate(() => new Promise((res) => {
  let tick = 0; const t0 = performance.now();
  const loop = () => { tick++; if (performance.now() - t0 < 1000) requestAnimationFrame(loop); else res({ tick, vis: document.visibilityState }); };
  requestAnimationFrame(loop);
}));
console.log(JSON.stringify(r));
await b.close();
