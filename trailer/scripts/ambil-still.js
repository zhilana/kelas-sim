// Ambil still resolusi tinggi dari aplikasi untuk trailer.
// Jalankan: node ambil-still.js  → trailer/public/still/*.png
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const URL = "http://localhost:3120/";
const OUT = path.resolve(__dirname, "../public/still");
const jeda = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const p = await ctx.newPage();
  const simpan = async (nama, tunggu = 900) => {
    await jeda(tunggu);
    await p.screenshot({ path: path.join(OUT, `${nama}.png`) });
    console.log("ok", nama);
  };

  await p.goto(URL, { waitUntil: "networkidle" });
  await jeda(3000);

  // ---------- menu ----------
  await simpan("menu-idle", 1200);
  for (let i = 0; i < 3; i++) {
    await p.locator("nav button").nth(i).hover();
    await simpan(`menu-hover-${i + 1}`, 1400);
  }
  await p.mouse.move(20, 20);
  await jeda(600);

  // ---------- simulasi ----------
  await p.getByRole("button", { name: /Mulai Simulasi/ }).first().click();
  await jeda(1800);
  await p.evaluate(() => document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")));
  await jeda(600);
  await simpan("sim-form", 900);

  await p.locator('button[type="submit"]').click();
  await jeda(3500);
  await simpan("sim-popup", 1600);

  const tutup = p.getByRole("button", { name: /Lihat kelasnya/i });
  if (await tutup.count()) {
    await tutup.click();
    await jeda(2500);
  }
  await simpan("sim-orbit", 2500);
  for (const [nama, label] of [["sim-atas", "Atas"], ["sim-depan", "Depan"], ["sim-dalam", "Dalam"]]) {
    const b = p.getByRole("button", { name: new RegExp("^" + label + "$") });
    if (await b.count()) {
      await b.first().click();
      await simpan(nama, 3200);
    }
  }

  // ---------- kalkulator ----------
  await p.getByRole("button", { name: /← Menu/ }).click();
  await jeda(1500);
  await p.keyboard.press("2");
  await jeda(1800);
  for (const t of ["7", "×", "8"]) {
    await p.getByRole("button", { name: t, exact: true }).first().click();
    await jeda(260);
  }
  await simpan("kalk", 900);

  // ---------- bahan ----------
  await p.getByRole("button", { name: /← Menu/ }).click();
  await jeda(1500);
  await p.getByRole("button", { name: /Bahan Bangunan/ }).first().click();
  await jeda(3000);
  await simpan("bahan-bata", 1600);
  for (const [nama, pola] of [
    ["bahan-batako", /Batako Semen/],
    ["bahan-kaca", /Kaca Bening/],
    ["bahan-baja", /Baja Ringan/],
    ["bahan-seng", /Seng Gelombang/],
  ]) {
    const b = p.getByRole("button", { name: pola }).first();
    if (await b.count()) {
      await b.click();
      await simpan(nama, 2000);
    }
  }

  await browser.close();
  console.log("selesai ->", OUT);
})();
