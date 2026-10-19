import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warn") console.log("[" + m.type() + "]", m.text().slice(0, 300)); });
p.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 500)));
await p.goto("http://localhost:3017/menu", { waitUntil: "networkidle" });
await p.waitForTimeout(3000);
const info = await p.evaluate(() => {
  const main = document.querySelector("main");
  const bazı = [...main.querySelectorAll("[data-reveal]")].map((el) => ({
    tag: el.tagName, op: getComputedStyle(el).opacity,
  }));
  const kata = [...main.querySelectorAll("[data-kata]")].map((el) => getComputedStyle(el).opacity);
  return { reveal: bazı, kata };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
