// Guard kualitas untuk kalimat karakter: menangkap string rusak yang pernah
// terjadi selama pengembangan (kata camel-case nyempil, karakter asing, dll).
import { semuaUcapan, UCAPAN_GURU, UCAPAN_SISWA, moodDari } from "../src/lib/ucapan";

const semua = semuaUcapan();

const POLA: [RegExp, string][] = [
  [/[a-z]{2,}[A-Z]/, "kata camel-case nyempil"],
  [/[一-鿿぀-ヿ가-힯]/, "karakter Asia Timur/Korea"],
  [/(pharmaco|posedge|Already|integ|seksual|namp|rame)/i, "kata asing"],
  [/[/\\|]/, "garis miring/backslash"],
  [/\s{2,}/, "spasi ganda"],
  [/\s[,.;!?]/, "spasi sebelum tanda baca"],
  [/^\s|\s$/, "spasi di awal/akhir"],
];

let rusak = 0;
for (const s of semua) {
  for (const [p, nama] of POLA) {
    if (p.test(s)) {
      console.log(`  RUSAK: ${JSON.stringify(s)} -> ${nama}`);
      rusak++;
      break;
    }
  }
}
console.log(rusak === 0 ? `  OK: ${semua.length} kalimat bersih` : `  ${rusak} kalimat rusak`);

// Tidak boleh ada kalimat kosong atau terlalu panjang (bikin bubble kegedean).
const kelewatPanjang = semua.filter((s) => s.length > 42);
console.log(kelewatPanjang.length ? `  Terlalu panjang: ${kelewatPanjang.join(" | ")}` : "  OK: panjang kalimat wajar");

// Tiap mood harus punya cukup variasi supaya tidak repetitif.
for (const m of ["panas", "dingin", "nyaman"] as const) {
  const s = UCAPAN_SISWA[m].length;
  const g = UCAPAN_GURU[m].length;
  console.log(`  ${m.padEnd(7)} siswa=${s} guru=${g} ${s >= 5 && g >= 3 ? "OK" : "KURANG"}`);
}

// Kalimat tidak boleh dobel antar mood maupun antar peran.
const duplikat = semua.filter((s, i) => semua.indexOf(s) !== i);
console.log(duplikat.length ? `  Duplikat: ${duplikat.join(" | ")}` : "  OK: tidak ada duplikat");

// Mood harus terpetakan persis sama dengan statusList di model.ts (>29, <22).
const kasus: [number, string][] = [
  [45, "panas"], [29.1, "panas"], [29, "nyaman"], [28.9, "nyaman"],
  [25, "nyaman"], [22.1, "nyaman"], [22, "nyaman"], [21.9, "dingin"], [10, "dingin"],
];
const salahMood = kasus.filter(([s, m]) => moodDari(s) !== m);
console.log(salahMood.length ? `  Mood salah: ${JSON.stringify(salahMood)}` : "  OK: pemetaan mood benar");

if (rusak > 0 || kelewatPanjang.length > 0 || duplikat.length > 0 || salahMood.length > 0) {
  console.error("\nUCAPAN_GAGAL");
  process.exit(1);
}
console.log("\nUCAPAN_OK", semua.length, "kalimat");