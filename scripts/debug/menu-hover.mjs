import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:3017/menu", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
const btn = p.locator("nav button").first();
await btn.hover();
await p.waitForTimeout(4000); // rAF headless lambat ~5x
const st = await btn.evaluate((el) => ({
  panah: getComputedStyle(el.querySelector("[data-panah]")).opacity,
  garis: getComputedStyle(el.querySelector("[data-garis]")).transform.split(",").map(Number).slice(0, 2),
  no: getComputedStyle(el.querySelector("[data-no]")).transform,
  teks: getComputedStyle(el).color,
}));
console.log(JSON.stringify(st));
await b.close();
