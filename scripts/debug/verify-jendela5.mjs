import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
p.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));
await p.goto("http://localhost:3017/simulasi", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.getByRole("button", { name: "Edit input" }).click();
await p.waitForTimeout(400);
await p.locator("aside").getByRole("button", { name: "Depan" }).last().click();
await p.waitForTimeout(500);
await p.getByRole("button", { name: /Hitung & bangun/ }).click();
await p.waitForTimeout(6500);
await p.screenshot({ path: "/home/jeli/.hermes/cache/scratch/jend-hasil3d.png", timeout: 15000 });
// putar kamera menghadap dinding depan? cek posisi default dulu
await p.close(); await b.close();
console.log("ok");
