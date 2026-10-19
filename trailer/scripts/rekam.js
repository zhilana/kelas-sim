// Rekam layar aplikasi Kelas-Sim untuk bahan trailer (dipakai Remotion).
// Jalankan: node rekam-trailer.js
// Hasil: trailer/public/raw/*.webm + trailer/public/raw/marks.json
// (marks.json = detik mulai/selesai aksi, dipakai untuk memotong klip).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const URL = "http://localhost:3120/";
const OUT = path.resolve(__dirname, "../public/raw");
const marks = {};

const jeda = (ms) => new Promise((r) => setTimeout(r, ms));

async function rekam(browser, nama, fn) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
    colorScheme: "light",
    deviceScaleFactor: 1,
  });
  const t0 = Date.now();
  const page = await ctx.newPage();
  const video = page.video();
  await page.goto(URL, { waitUntil: "networkidle" });
  await jeda(1500);
  const mulai = (Date.now() - t0) / 1000;
  await fn(page);
  const selesai = (Date.now() - t0) / 1000;
  await ctx.close();
  const src = await video.path();
  fs.renameSync(src, path.join(OUT, `${nama}.webm`));
  marks[nama] = { mulai, selesai };
  console.log("ok", nama, mulai.toFixed(2), "->", selesai.toFixed(2));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--force-device-scale-factor=1"] });

  // 1. Menu utama: hover tiap kartu, lalu klik Mulai Simulasi
  await rekam(browser, "menu", async (p) => {
    const kartu = p.locator("nav button");
    await jeda(600);
    for (let i = 0; i < 3; i++) {
      const b = await kartu.nth(i).boundingBox();
      await p.mouse.move(b.x + b.width * 0.4, b.y + b.height / 2, { steps: 18 });
      await jeda(900);
    }
    const pertama = await kartu.nth(0).boundingBox();
    await p.mouse.move(pertama.x + pertama.width * 0.4, pertama.y + pertama.height / 2, { steps: 14 });
    await jeda(500);
    await p.mouse.down();
    await p.mouse.up();
    await jeda(1800);
  });

  // 2. Simulasi: isi form, submit, popup peringkat, lalu putar kelas 3D
  await rekam(browser, "simulasi", async (p) => {
    await p.getByRole("button", { name: /Mulai Simulasi/ }).first().click();
    await jeda(1800);
    await p.evaluate(() => document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")));
    await jeda(700);
    const siswa = p.locator('input[type="number"]').nth(3);
    await siswa.scrollIntoViewIfNeeded();
    await jeda(400);
    await siswa.fill("28");
    await jeda(900);
    await p.locator('button[type="submit"]').scrollIntoViewIfNeeded();
    await jeda(500);
    await p.locator('button[type="submit"]').click();
    await jeda(2600);
    const tutup = p.getByRole("button", { name: /Lihat kelasnya/i });
    if (await tutup.count()) {
      await jeda(1200);
      await tutup.click();
    }
    await jeda(1800);
    const canvas = await p.$("canvas");
    const box = await canvas.boundingBox();
    await p.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.55);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width * 0.32, box.y + box.height * 0.5, { steps: 26 });
    await p.mouse.up();
    await jeda(900);
    const atas = p.getByRole("button", { name: /^Atas$/ });
    if (await atas.count()) {
      await atas.first().click();
      await jeda(2400);
    }
    const depan = p.getByRole("button", { name: /^Depan$/ });
    if (await depan.count()) {
      await depan.first().click();
      await jeda(2200);
    }
  });

  // 3. Kalkulator: ketik 7 × 8 = lalu ubah input kelas
  await rekam(browser, "kalkulator", async (p) => {
    await p.keyboard.press("2");
    await jeda(1400);
    const klik = async (t) => {
      await p.getByRole("button", { name: t, exact: true }).first().click();
      await jeda(340);
    };
    for (const t of ["7", "×", "8", "="]) await klik(t);
    await jeda(1000);
    await klik("C");
    for (const t of ["3", "6", "0", "÷", "4", "="]) await klik(t);
    await jeda(900);
    const siswa = p.locator('input[type="number"]').nth(3);
    await siswa.scrollIntoViewIfNeeded();
    await siswa.fill("24");
    await jeda(1200);
  });

  // 4. Bahan bangunan: klik beberapa bahan, biarkan model 3D berputar
  await rekam(browser, "bahan", async (p) => {
    await p.getByRole("button", { name: /Bahan Bangunan/ }).first().click();
    await jeda(2600);
    const urutan = [/Batako Semen/, /Bata Ringan/, /Beton Bertulang/, /Kaca Bening/, /Baja Ringan/, /Seng Gelombang/];
    for (const u of urutan) {
      const b = p.getByRole("button", { name: u }).first();
      if (await b.count()) {
        await b.click();
        await jeda(1400);
      }
    }
  });

  await browser.close();
  fs.writeFileSync(path.join(OUT, "marks.json"), JSON.stringify(marks, null, 2));
  console.log("selesai ->", OUT);
})();
