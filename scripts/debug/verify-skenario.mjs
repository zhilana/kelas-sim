import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
p.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 150)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(1800);
// pratinjau suhu + status awal (belum ada yang aktif)
const chips = await p.evaluate(() =>
  [...document.querySelectorAll("aside [aria-pressed]")].map((b) => ({
    teks: b.textContent.trim().split("\n")[0].slice(0, 30),
    pratinjau: b.querySelector("data").textContent,
    aktif: b.getAttribute("aria-pressed") === "true",
  })));
console.log("chip awal:", JSON.stringify(chips, null, 1));
// klik Kipas Mati → aktif + telemetri header berubah
const sebelum = await p.locator("header [data]:not(header)").first().textContent();
await p.getByRole("button", { name: /Kipas Mati/ }).click();
await p.waitForTimeout(800);
const sesudahChip = await p.evaluate(() =>
  [...document.querySelectorAll("aside [aria-pressed]")].map((b) => b.getAttribute("aria-pressed")));
console.log("status chip setelah klik Kipas Mati:", JSON.stringify(sesudahChip));
// suhu header berubah?
const tKipasMati = await p.locator("header temp? header data").first();
const suhuHeader = await p.evaluate(() => document.querySelector("header data")?.textContent);
console.log("suhu header setelah skenario:", suhuHeader);
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/ed-skenario.png" });
await p.close();
await b.close();
