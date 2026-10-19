import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const err = [];
p.on("pageerror", (e) => err.push(String(e).slice(0, 200)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);

// --- Sejajar: yakinkan kustom aktif lewat drag satu meja jauh ---
const meja = p.locator("[data-denah-meja]").first();
const box = await meja.boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await p.mouse.down();
await p.mouse.move(box.x + 150, box.y - 90, { steps: 6 }); // drague satu meja acak
await p.mouse.up();
const zSebelum = await p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-meja]")].map((m) => {
    const tt = m.getAttribute("transform") ?? m;
    return null;
  })
);
// posisi dari atribut svg kurang praktis — baca punya react? cukup ukur rect
const rects0 = await p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-meja]")].map((m) => {
    const r = m.querySelector("rect").getBoundingClientRect();
    return [Math.round(r.x), Math.round(r.y)];
  })
);
console.log("sebelum sejajar (px):", rects0.slice(0, 8).join(" | "));
await p.click("button:has-text('Sejajar')");
await p.waitForTimeout(800);
const rects1 = await p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-meja]")].map((m) => {
    const r = m.querySelector("rect").getBoundingClientRect();
    return [Math.round(r.x), Math.round(r.y)];
  })
);
// struktur: z (y) hanya berlaku per baris; cek baris & kolom rapat
const ys = [...new Set(rects1.map((r) => r[1]))].sort((a, b) => a - b);
const perBaris = ys.map((y) => rects1.filter((r) => r[1] === y).map((r) => r[0]).sort((a, b) => a - b));
const zItuRapi = perBaris.length >= 2 && ys.every((y, i) => i === 0 || y - ys[i - 1] >= 40); // >=~0.75m? 34px/m → 25px
const xRapat = perBaris.every((row) => { const d = row.slice(1).map((x, i) => x - row[i]); return d.every((v) => v === d[0]); });
console.log("baris y:", ys, "per baris x:", JSON.stringify(perBaris.map((r) => r.length)));
console.log("z rapat:", zItuRapi, "| x seragam:", xRapat);
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-sejajar.png" });

// --- kembali verifikasi visual lain (desktop, penuh, mobile, hasil) ---
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(1800);
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-desktop.png" });
await p.click("[aria-label='Perbesar denah layar penuh']");
await p.waitForTimeout(1200);
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-penuh.png" });
await p.keyboard.press("Escape");
await p.getByRole("button", { name: /Hitung & bangun/ }).click();
await p.waitForTimeout(3500);
console.log("hasil:", JSON.stringify(await p.evaluate(() => ({
  denahSvg: [...document.querySelectorAll("svg[role='img']")].length,
  kanvas3d: !!document.querySelector("canvas"),
}))));
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-hasil.png" });
await p.close();

const m = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await m.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await m.waitForTimeout(1800);
await m.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-mobile.png" });
await m.close();
console.log("pageerror:", JSON.stringify(err));
await b.close();
