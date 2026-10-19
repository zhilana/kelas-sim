import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
p.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 150)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(1800);
const chip = async (i) => p.evaluate((idx) => {
  const b = document.querySelectorAll("aside [aria-pressed]")[idx];
  return { aktif: b.getAttribute("aria-pressed") === "true", suhu: document.querySelector("header data")?.textContent?.trim() };
}, i);
console.log("sebelum  :", JSON.stringify(await chip(3)));
await p.getByRole("button", { name: /Kipas Mati/ }).click();
await p.waitForTimeout(700);
console.log("klik Kipas Mati:", JSON.stringify(await chip(3)));
const st0 = await p.showDialog? null:0;
await p.getByRole("button", { name: /Siang Terik/ }).click();
await p.waitForTimeout(700);
console.log("klik Siang Terik:", JSON.stringify(await chip(1)));
// aktif hilang saat form digeser manual (slider jumlahKipas?) — pakai preset lain terus tarik slider
await p.locator("input[type=range]").first().fill("9");
await p.waitForTimeout(500);
console.log("setelah slider digeser (trimasuk tak aktif):", JSON.stringify(await chip(1).then(i => i)));
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-skenario.png" });
await p.close();
await b.close();
