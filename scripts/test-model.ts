// Pengecekan cepat model fisika — pengganti test_model.py
import assert from "node:assert";
import { simulate, setengahZonaPapan } from "../src/lib/model";

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

// dua pilihan susunan: baris (default) & kelompok (pasangan meja)
assert.equal(r.tataLetak.length, simulate({ susun: "berkelompok" }).tataLetak.length);
const rk = simulate({ susun: "berkelompok" });
assert.equal(rk.tataLetak.length, r.input.jumlahMeja);
assert.ok(!rk.tapak.tabrakan, "susunan kelompok default tidak boleh tabrakan");
const beda = rk.tataLetak.some((m, i) => m.x !== r.tataLetak[i].x);
assert.ok(beda, "posisi x kelompok harus berbeda dari baris");
// ukuran sempit + meja banyak tetap kembali jumlahnya (& tabrakan dilaporkan)
const rk2 = simulate({ susun: "berkelompok", panjang: 4, lebar: 4, jumlahMeja: 40, jumlahSiswa: 40 });
assert.equal(rk2.tataLetak.length, 40);

// jendela: unit {sisi, offset} — default mengikuti posisiJendela
assert.ok(r.jendelaUnits.every((u) => u.sisi === "kiri"));
assert.equal(r.jendelaUnits.length, 3);
// dinding depan: jendela TIDAK boleh menabrak zona papan tulis (bug "nyatu")
const rd = simulate({ posisiJendela: "depan" });
const zona = setengahZonaPapan(rd.input.panjang);
assert.ok(
  rd.jendelaUnits.length > 0 &&
    rd.jendelaUnits.every((u) => u.sisi === "depan" && Math.abs(u.offset) >= zona),
  "jendela dinding depan tidak boleh menyatu dengan papan tulis",
);
// kustom: tiap unit bisa beda dinding; offset dijepit & zona papan dijaga
const rj = simulate({
  jumlahJendela: 2,
  jendelaKustom: [
    { sisi: "belakang", offset: 99 },
    { sisi: "depan", offset: 0 },
  ],
});
assert.equal(rj.jendelaUnits.length, 2);
assert.equal(rj.jendelaUnits[0].sisi, "belakang");
assert.equal(rj.jendelaUnits[0].offset, 3.3); // dinding 8 m → jepit ±(4 − 0,7)
assert.ok(Math.abs(rj.jendelaUnits[1].offset) >= zona, "unit depan dijepit keluar zona papan");

console.log(
  "MODEL_OK",
  h.suhuDalam,
  h.pergantianUdara,
  h.skorKenyamanan,
  "| langkah:",
  r.langkah.length,
);
