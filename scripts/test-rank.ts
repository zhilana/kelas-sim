// Cek modul peringkat: setiap tier harus terjangkau & alasan harus koheren.
import { simulate } from "../src/lib/model";
import { rankKelas, TIERS } from "../src/lib/rank";

const base = {
  panjang: "8", lebar: "7", tinggi: "3.2",
  jumlahSiswa: "32", jumlahMeja: "32", jumlahKursi: "32",
  jumlahJendela: "3", posisiJendela: "kiri", bukaanPct: "70",
  bahanBangunan: "bata", suhuLuar: "31", radiasiMatahari: "650",
  kecepatanAngin: "1", jumlahKipas: "2", dayaPerangkat: "250",
  transmisiKaca: "0.65",
};

// Setiap tier harus bisa dicapai oleh kombinasi input nyata.
const skenario: [string, Record<string, unknown>][] = [
  ["SULTAN", { panjang: "14", lebar: "11", jumlahSiswa: "10", jumlahJendela: "8", bukaanPct: "100", kecepatanAngin: "6", jumlahKipas: "6", bahanBangunan: "panel_sandwich", suhuLuar: "24", radiasiMatahari: "300" }],
  ["MEWAH", { panjang: "12", lebar: "10", jumlahSiswa: "18", jumlahJendela: "6", bukaanPct: "100", kecepatanAngin: "4", jumlahKipas: "4", bahanBangunan: "bata_insulasi", suhuLuar: "25" }],
  ["NYAMAN", { panjang: "11", lebar: "9", jumlahSiswa: "24", jumlahJendela: "5", bukaanPct: "90", kecepatanAngin: "3", jumlahKipas: "3" }],
  ["STANDAR", {}],
  ["PADAT", { jumlahSiswa: "46", jumlahMeja: "46", jumlahKursi: "46", jumlahJendela: "2", bukaanPct: "40", kecepatanAngin: "0.5", jumlahKipas: "1", bahanBangunan: "bata" }],
  ["GERAH", { panjang: "6", lebar: "4", tinggi: "2.6", jumlahSiswa: "55", jumlahMeja: "55", jumlahKursi: "55", jumlahJendela: "1", bukaanPct: "10", kecepatanAngin: "0", jumlahKipas: "0", suhuLuar: "36", radiasiMatahari: "1100", bahanBangunan: "bata" }],
  ["HUKUMAN", { panjang: "4", lebar: "3", tinggi: "2.4", jumlahSiswa: "60", jumlahMeja: "60", jumlahKursi: "60", jumlahJendela: "0", bukaanPct: "0", kecepatanAngin: "0", jumlahKipas: "0", suhuLuar: "42", radiasiMatahari: "1200", dayaPerangkat: "3000", bahanBangunan: "bata" }],
];

console.log("tier        min   │ hasil tiap skenario");
console.log("─".repeat(64));
for (const [label, patch] of skenario) {
  const r = simulate({ ...base, ...patch });
  const p = rankKelas(r);
  console.log(
    `${(p.tier.kode + " " + p.tier.nama).padEnd(24)} skor=${String(p.skor).padStart(3)} │ ${label.split(" ")[0]}`
  );
  console.log(`   ringkas: ${p.ringkas}`);
  console.log(`   alasan  : ${p.reasons.map((x) => `${x.arah === "baik" ? "+" : "-"} ${x.teks} (${x.angka})`).join(" | ") || "(tidak ada)"}`);
}

// Cek semua tier tercapai & tidak ada string rusak.
const tercapai = new Set<string>();
for (let L = 3; L <= 20; L++) for (let W = 3; W <= 12; W++) for (let n = 1; n <= 60; n += 7) {
  const r = simulate({ panjang: String(L), lebar: String(W), jumlahSiswa: String(n), jumlahMeja: String(n), jumlahKursi: String(n), jumlahJendela: String(n % 9), bukaanPct: String(n % 101), suhuLuar: String(20 + (n % 20)), kecepatanAngin: String(n % 10), jumlahKipas: String(n % 8) });
  tercapai.add(rankKelas(r).tier.kode);
}
console.log("\ntier tercapai lewat sweep:", [...tercapai].sort().join(", "));
console.log("tier terdaftar         :", TIERS.map((t) => t.kode).join(", "));

const kurang = TIERS.filter((t) => !tercapai.has(t.kode));
console.log(kurang.length ? `\nPERINGATAN: tier tak terjangkau: ${kurang.map((t) => t.kode).join(", ")}` : "\nOK: semua tier terjangkau");

// Guard anti-typing: alasan harus kalimat Indonesia yang wajar.
const semuaAlasan = new Set<string>();
for (const [, patch] of skenario) {
  const p = rankKelas(simulate({ ...base, ...patch }));
  p.reasons.forEach((x) => semuaAlasan.add(x.teks));
}
console.log("\nseluruh frasa alasan yang mungkin muncul:");
[...semuaAlasan].sort().forEach((s) => console.log("  - " + s));

const rusak = [...semuaAlasan].filter((s) => /pharmaco|nascent|keggable|nascen|[a-z]{2,}[A-Z]/.test(s));
console.log(rusak.length ? `\nADA FRASA RUSAK: ${rusak.join(", ")}` : "\nOK: tidak ada frasa rusak");