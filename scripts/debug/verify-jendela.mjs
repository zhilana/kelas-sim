import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
p.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);

// BUG "nyatu": posisi jendela = Depan → semua jendela harus di luar zona papan
await p.getByRole("button", { name: "Depan" }).last().click();
await p.waitForTimeout(1500);
const sisiAll = await p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-jendela]")].map((m) => m.getAttribute("data-jendela-sisi")));
const posG = await p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-jendela]")].map((m) => {
    const r = m.querySelector("rect").getBoundingClientRect();
    return Math.round(r.x);
  }));
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/jend-depan.png" });
console.log("posisi=depan → dinding:", sisiAll.join(","), "| x px:", posG.join(","));

// EDIT: drag satu jendela dari dinding depan ke dinding belakang
const w0 = await p.locator("[data-denah-jendela]").first().boundingBox();
const w4 = await p.locator("[data-denah-jendela]").first(); // ambil pertama yang dinding depan
await p.mouse.move(w0.x + w0.width / 2, w0.y + w0.height / 2);
await p.mouse.down();
// buka ke dinding belakang (bawah denah): dari atas denah ke bawah
const svg = await p.locator("svg[role='img']").first().boundingBox();
await p.mouse.move(svg.x + svg.width * 0.3, svg.y + svg.height * 0.9, { steps: 12 });
await p.mouse.up();
await p.waitForTimeout(500);
const sisiSesudah = await p.evaluate(() =>
  [...document.querySelectorAll("[data-denah-jendela]")].map((m) => m.getAttribute("data-jendela-sisi")));
console.log("setelah drag → dinding:", sisiSesudah.join(","), "(cari belakang)");
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/jend-drag.png" });

// generate → cek 3D hidup
await p.getByRole("button", { name: /Hitung & bangun/ }).click();
await p.waitForTimeout(4000);
console.log("hasil:", JSON.stringify(await p.evaluate(() => ({
  kanvas3d: !!document.querySelector("canvas"),
  denahSvg: [...document.querySelectorAll("svg[role='img']")].length,
}))));
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/jend-hasil.png" });
await p.close();
await b.close();
