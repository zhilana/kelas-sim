import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
p.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.getByRole("button", { name: "Edit input" }).click();
await p.waitForTimeout(500);
await p.locator("aside").getByRole("button", { name: "Depan" }).last().click();
await p.waitForTimeout(1000);
const info = await p.evaluate(() => {
  const ws = [...document.querySelectorAll("[data-denah-jendela]")];
  const board = document.querySelectorAll("svg[role='img'] line")[0].getBoundingClientRect();
  const box = ws.map((m) => m.getBoundingClientRect());
  return {
    boardX: [Math.round(board.x), Math.round(board.right)],
    kiriSisi: box.filter((r) => r.right < board.x).length,
    kananSisi: box.filter((r) => r.x > board.right).length,
    n: ws.length,
  };
});
console.log("depan:", JSON.stringify(info), "| nabrak:", info.n - info.kiriSisi - info.kananSisi);
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/jend-depan4.png" });
await p.close(); await b.close();
