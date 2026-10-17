// Pengecekan cepat model fisika — pengganti test_model.py
import assert from "node:assert";
import { simulate } from "../src/lib/model";

const r = simulate({});
const h = r.hasil;

assert.equal(h.luasLantai, 56);
assert.equal(h.volume, 179.2);
assert.ok(h.suhuDalam > r.input.suhuLuar, "suhu dalam harus lebih panas dari luar");
assert.equal(r.tataLetak.length, r.input.jumlahMeja);

// jendela
assert.equal(h.luasBukaan, 3 * 1.8);
assert.equal(r.input.posisiJendela, "kiri");
assert.equal(r.langkah.length >= 10, true);
assert.ok(r.langkah.every((l) => l.rumus && l.substitusi && l.hasil));
// rumus kini dalam LaTeX
assert.ok(r.langkah.every((l) => l.rumus.includes("\\")), "rumus harus mengandung perintah LaTeX");

// clamp & posisi tidak dikenal → fallback kiri
const r2 = simulate({ jumlahJendela: "99", posisiJendela: "atas", panjang: "100" });
assert.equal(r2.input.jumlahJendela, 8);
assert.equal(r2.input.posisiJendela, "kiri");
assert.equal(r2.input.panjang, 20);

// nol jendela tetap ada ventilasi minimum dari kipas
const r3 = simulate({ jumlahJendela: 0 });
assert.ok(r3.hasil.debitUdara >= 0.05);

console.log(
  "MODEL_OK",
  h.suhuDalam,
  h.pergantianUdara,
  h.skorKenyamanan,
  "| langkah:",
  r.langkah.length,
);
