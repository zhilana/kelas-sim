import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("http://localhost:3017/menu", { waitUntil: "networkidle" });
await p.waitForTimeout(3000);
const data = await p.evaluate(() => {
  const nav = document.querySelector("nav");
  const rows = [...nav.querySelectorAll("button")].map((b) => {
    const r = b.getBoundingClientRect();
    const o = getComputedStyle(b);
    return { teks: b.textContent.trim().slice(0, 20), y: Math.round(r.y), h: Math.round(r.height), opacity: o.opacity };
  });
  return {
    tinggiDok: document.documentElement.scrollHeight,
    visiViewport: window.innerHeight,
    rows,
    dapatScroll: document.documentElement.scrollHeight > window.innerHeight,
  };
});
console.log(JSON.stringify(data, null, 1));
await b.close();
