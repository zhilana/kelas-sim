import { chromium } from "playwright";
const b = await chromium.launch();

// ---------- desktop ----------
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const err = [];
p.on("pageerror", (e) => err.push(String(e).slice(0, 200)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const layar = await p.evaluate(() => {
  const denah = [...document.querySelectorAll("section")].find((s) => s.querySelector("[data-denah-meja]"));
  const aside = document.querySelector("aside");
  const d = denah?.getBoundingClientRect(), a = aside?.getBoundingClientRect();
  return { denah: d && { x: Math.round(d.x), y: Math.round(d.y), w: Math.round(d.w ?? d.width), h: Math.round(d.height) },
           sidebar: a && { x: Math.round(a.x), w: Math.round(a.width) },
           meja: document.querySelectorAll("[data-denah-meja]").length,
           scrolH: document.documentElement.scrollHeight };
});
console.log("layout:", JSON.stringify(layar), "pageerror:", err.length);
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-desktop.png" });

// fullscreen
await p.click("[aria-label='Perbesar denah layar penuh']");
await p.waitForTimeout(1200);
const fs = await p.evaluate(() => {
  const denah = [...document.querySelectorAll("section")].find((s) => s.querySelector("[data-denah-meja]"));
  const r = denah.getBoundingClientRect();
  return { fixed: getComputedStyle(denah).position, w: Math.round(r.width), h: Math.round(r.height) };
});
console.log("fullscreen:", JSON.stringify(fs));
await p.screenshot({ path: "/home/jili/.hermes/cache/scratch/x.png" }).catch(() => {});
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-penuh.png" });
// Esc keluar
await p.keyboard.press("Escape");
await p.waitForTimeout(500);
console.log("setelah Esc posisi:", await p.evaluate(() => getComputedStyle(
  [...document.querySelectorAll("section")].find((s) => s.querySelector("[data-denah-meja]"))
).position));

// susun kelompok
const xBaris = await p.evaluate(() => [...document.querySelectorAll("[data-denah-meja]")].slice(0, 4).map((m) => m.getBoundingClientRect().x));
await p.getByRole("button", { name: "Kelompok" }).click();
await p.waitForTimeout(1000);
const xKel = await p.evaluate(() => [...document.querySelectorAll("[data-denah-meja]")].slice(0, 4).map((m) => m.getBoundingClientRect().x));
console.log("posisi x baris:", xBaris.map(Math.round), "→ kelompok:", xKel.map(Math.round));
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-kelompok.png" });

// generate → hasil (ada denah?)
await p.getByRole("button", { name: /Hitung & bangun/ }).click();
await p.waitForTimeout(3500);
const hasil = await p.evaluate(() => {
  const svgTerakhir = [...document.querySelectorAll("svg[role='img']")].length;
  return { denahHasil: svgTerakhir, canvas3d: !!document.querySelector("canvas") };
});
console.log("hasil:", JSON.stringify(hasil));
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-hasil.png" });
await p.close();

// ---------- mobile ----------
const m = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await m.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await m.waitForTimeout(1800);
await m.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-mobile.png" });
await m.close();
console.log("pageerror:", JSON.stringify(err));
await b.close();
