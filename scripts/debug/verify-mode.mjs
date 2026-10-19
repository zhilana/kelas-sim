import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const err = [];
p.on("pageerror", (e) => err.push(String(e).slice(0, 150)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);

const kual = () => p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-meja]")].map((m) => {
    const r = m.querySelector("rect").getBoundingClientRect();
    return [Math.round(r.x), Math.round(r.y)];
  }));

console.log("kustom aktif default (Atur ulang):", await p.locator("button:has-text('Atur ulang')").count() > 0);

// drag langsung tanpa pencet Geser
const box = await p.locator("[data-denah-meja]").first().boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.down();
await p.mouse.move(box.x + 220, box.y + 60, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(300);
const s0 = await kual();
console.log("setelah drag langsung (3 meja):", JSON.stringify(s0.slice(0, 3)));

// Edit input: alat hilang & drag tak jalan
await p.getByRole("button", { name: "Edit input" }).click();
await p.waitForTimeout(600);
console.log("mode input, alat terlihat:", await p.locator("button:has-text('Geser')").count());
const sIn = await kual();
console.log("posisi setelah edit input:", JSON.stringify(sIn.slice(0, 3)), "| sama-kah dg hasil drag:", JSON.stringify(sIn) === JSON.stringify(s0));

// balik Edit denah: alat muncul, drag jalan lagi
await p.getByRole("button", { name: "Edit denah" }).click();
await p.waitForTimeout(600);
console.log("mode denah, alat terlihat:", await p.locator("button:has-text('Geser')").count());
const box2 = await p.locator("[data-denah-meja]").last().boundingBox();
await p.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
await p.mouse.down();
await p.mouse.move(box2.x + 100, box2.y - 50, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(300);
const s1 = await kual();
console.log("setelah drag ke-2 (3 meja terakhir):", JSON.stringify(s1.slice(-3)));
console.log("pageerror:", JSON.stringify(err));
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-mode.png" });
await p.close();
await b.close();
