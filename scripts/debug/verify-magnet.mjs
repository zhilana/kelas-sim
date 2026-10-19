import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
p.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 150)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);

const exact = () => p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-meja]")].map((m) => {
    const r = m.querySelector("rect").getBoundingClientRect();
    return { x: r.x, y: r.y };
  }));

// posisi kolom meja #0
let s = await exact();
const kolomX = s[0].x;

// 1) drag meja #1 ke pinggirیده kolom #0 (offset ~8px = 0.2-0.3m) → harus magnet
const b1 = s[1];
console.log("meja#1 awal:", b1.x.toFixed(1), "| kolomX:", kolomX.toFixed(1));
await p.mouse.move(b1.x + 4, b1.y + 4);
await p.mouse.down();
// gerak sampai dekat x kolom#0 tapi kira-kira 8px di dalam kurun
await p.mouse.move(kolomX + 8, s[0].y + 30, { steps: 10 });
await p.mouse.up();
await p.waitForTimeout(400);
s = await exact();
console.log("meja#1 setelah magnet x:", s[1].x.toFixed(2), "| selisih kolom:", (s[1].x - kolomX).toFixed(2), "px");

// 2) baris: drag meja#1 hingga y dekat y meja#31 (baris lain), cek y persis
const barisY = s[31].y;
await p.mouse.move(s[1].x + 4, s[1].y + 4);
await p.mouse.down();
await p.mouse.move(s[1].x, barisY + 6, { steps: 10 });
await p.mouse.up();
await p.waitForTimeout(400);
s = await exact();
console.log("meja#1 setelah magnet y:", s[1].y.toFixed(2), "| selisih baris:", (s[1].y - barisY).toFixed(2), "px");
await b.close();
