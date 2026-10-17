// Screenshot UI untuk verifikasi visual (butuh server berjalan di :3000)
import { chromium } from "playwright";

const out = process.argv[2] ?? "/tmp/opencode";
const b = await chromium.launch({ args: ["--no-sandbox"] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });

await pg.goto("http://localhost:3000", { waitUntil: "networkidle" });
await pg.waitForTimeout(1200);
await pg.screenshot({ path: `${out}/ui-input.png` });

await pg.click('button[type="submit"]');
await pg.waitForSelector("canvas", { timeout: 15000 });
await pg.waitForTimeout(3500); // tunggu intro kamera selesai
await pg.screenshot({ path: `${out}/ui-hasil.png` });

const dbg = await pg.evaluate(() => window.__kelasScene?.() ?? "hook-tidak-ada");
console.log("DEBUG_SCENE:", JSON.stringify(dbg));

// Orbit ke arah dinding kiri (drag ke kanan) lalu potret lagi
const canvas = await pg.$("canvas");
if (canvas) {
  const bb = await canvas.boundingBox();
  const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
  await pg.mouse.move(cx, cy);
  await pg.mouse.down();
  await pg.mouse.move(cx + 420, cy - 40, { steps: 12 });
  await pg.mouse.up();
  await pg.waitForTimeout(900);
  await pg.screenshot({ path: `${out}/ui-orbit.png` });
}

await b.close();
console.log("OK");
