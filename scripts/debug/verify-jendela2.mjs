import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
p.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
// mode Edit input → form mengendalikan jendela
await p.getByRole("button", { name: "Edit input" }).click();
await p.waitForTimeout(600);
// pilih Depan
await p.locator("aside").getByRole("button", { name: "Depan" }).last().click();
await p.waitForTimeout(1200);
const cek = await p.evaluate(() => {
  const ws = [...document.querySelectorAll("[data-denah-jendela]")];
  const sisi = ws.map((m) => m.getAttribute("data-jendela-sisi"));
  // zona papan dalam px: papan span sx(-0.3L)..sx(0.3L) pada denah
  // cek via perbandingan: window x harus di luar band papan
  const w0 = ws[0].getBoundingClientRect();
  return { sisi, x: ws.map((m) => Math.round(m.getBoundingClientRect().x)) };
});
console.log("Edit input + Depan:", JSON.stringify(cek));
// h maarat: band papan tengah round x=? board w = 0.6*L; lebar denah ~
console.log(lineMobile ? "" : "");
const lebar = 464; // nggak penting: cukup band tengah ±0.55 * half
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/jend-depan.png" });
await p.close();
await b.close();
console.log("ok");
