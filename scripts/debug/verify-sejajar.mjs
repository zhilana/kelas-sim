import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const rects = () => p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-meja]")].map((m) => {
    const r = m.querySelector("rect").getBoundingClientRect();
    return [Math.round(r.x), Math.round(r.y)];
  }));
const box = await p.locator("[data-denah-meja]").first().boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.down();
await p.mouse.move(box.x + 260, box.y + 140, { steps: 12 });
await p.mouse.up();
await p.waitForTimeout(300);
const s0 = await rects();
const beda0 = JSON.stringify(s0.slice(0, 3)) ;
console.log("setelah drag (3 pertama):", beda0);
await p.click("button:has-text('Sejajar')");
await p.waitForTimeout(600);
const s1 = await rects();
console.log("setelah sejajar:", JSON.stringify(s1.slice(0, 3)));
// bandingkan dengan grid semula: pertama ujung kiri atas
const s2 = await p.evaluate(() => {
  const r = [...document.querySelectorAll("[data-denah-meja]")].map((m) => {
    const q = m.querySelector("rect").getBoundingClientRect();
    return [Math.round(q.x), Math.round(q.y)];
  });
  const ys = [...new Set(r.map((v) => v[1]))].sort((a, b) => a - b);
  const zOk = ys.every((y, i) => i === 0 || y - ys[i - 1] >= 20);
  const xUnik = [...new Set(r.map((v) => v[0]))].length;
  return { n: r.length, baris: ys.length, zOk, xUnik };
});
console.log(JSON.stringify(s2), s2.n === 32 ? "OK meja utuh" : "HILANG!");
await p.close();
await b.close();
