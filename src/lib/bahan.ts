// Katalog bahan bangunan yang benar-benar dipakai di ruang kelas / sekolah.
// Data ini murni untuk tampilan (nama, deskripsi, contoh pemakaian) —
// perhitungan fisika tetap di lib/model.ts.

export type Kategori = "Dinding" | "Struktur" | "Atap" | "Plafon" | "Lantai" | "Bukaan" | "Kusen";

export type Bahan = {
  id: string;
  nama: string;
  kategori: Kategori;
  /** dimensi satuan yang umum dijual */
  ukuran: string;
  /** transmisi panas dinding W/(m²·K) — hanya untuk bahan dinding */
  u: number | null;
  /** warna kartu/aksen */
  warna: string;
  /** satu baris untuk daftar */
  ringkas: string;
  deskripsi: string;
  /** contoh nyata di sekolah */
  dipakaiDi: string[];
  plus: string[];
  minus: string[];
};

export const BAHAN: Bahan[] = [
  {
    id: "bata_merah",
    nama: "Bata Merah",
    kategori: "Dinding",
    ukuran: "230 × 110 × 50 mm",
    u: 2.0,
    warna: "#b0492e",
    ringkas: "Tanah liat dibakar — dinding paling umum di sekolah Indonesia.",
    deskripsi:
      "Bata merah dicetak dari tanah liat lalu dibakar pada suhu ±900 °C sampai mengeras. Dipasang bertingkat dengan spesi 1 PC : 4 PP, kemudian diplester dan dicat. Massa termalnya besar, jadi ruangan terasa lebih stabil: lambat panas saat siang dan lambat dingin saat malam.",
    dipakaiDi: ["Dinding ruang kelas", "Dinding laboratorium", "Dinding kantin & ruang guru", "Pagar sekolah"],
    plus: ["Kuat dan tahan lama", "Meredam panas & suara", "Bahan lokal, mudah dicari"],
    minus: ["Pemasangan lambat", "Berat, perlu struktur kuat", "Wajib diplester dan dicat"],
  },
  {
    id: "batako",
    nama: "Batako Semen",
    kategori: "Dinding",
    ukuran: "400 × 200 × 100 mm",
    u: 2.2,
    warna: "#8d8d86",
    ringkas: "Blok semen cetak berongga, pemasangan jauh lebih cepat dari bata.",
    deskripsi:
      "Batako dibuat dari campuran semen, pasir, dan air yang dicetak lalu dikeringkan. Ukurannya jauh lebih besar dari bata merah sehingga satu meter persegi dinding hanya butuh sekitar 12–13 buah. Rongga di dalamnya meringankan blok dan sedikit membantu menahan panas.",
    dipakaiDi: ["Dinding kelas tambahan", "Gudang & ruang alat", "Dinding penyekat kantin", "Dinding toilet sekolah"],
    plus: ["Cepat dipasang", "Lebih murah per m²", "Rongga meringankan beban"],
    minus: ["Permukaan kasar, wajib plester", "Rapuh saat diangkut", "Kedap suara lebih rendah dari bata"],
  },
  {
    id: "hebel",
    nama: "Bata Ringan (Hebel)",
    kategori: "Dinding",
    ukuran: "600 × 200 × 100 mm",
    u: 1.4,
    warna: "#dcdad0",
    ringkas: "Beton aerasi ringan — dinding cepat, rapi, dan lebih sejuk.",
    deskripsi:
      "Bata ringan atau AAC (Autoclaved Aerated Concrete) dibuat dari pasir silika, semen, kapur, dan aluminium pasta, lalu dikukus bertekanan. Beratnya hanya sekitar sepertiga bata merah, direkatkan dengan thin-bed mortar 3 mm sehingga dinding jadi tipis dan rata. Nilai U-nya paling rendah di antara dinding umum, artinya paling tahan panas.",
    dipakaiDi: ["Kelas baru / rehab sekolah", "Partisi ruang guru", "Dinding laboratorium komputer", "Ruang UKS"],
    plus: ["Ringan, cepat dipasang", "Paling tahan panas (U ≈ 1,4)", "Permukaan rata, hemat plester"],
    minus: ["Harga satuan lebih mahal", "Perlu alat potong khusus", "Kurang cocok untuk dinding yang sering dibentur"],
  },
  {
    id: "beton",
    nama: "Beton Bertulang",
    kategori: "Struktur",
    ukuran: "Kolom 150 × 150 mm · balok 200 × 300 mm",
    u: null,
    warna: "#a8a8a2",
    ringkas: "Rangka utama bangunan: kolom, balok, sloof, dan dak.",
    deskripsi:
      "Campuran semen, pasir, kerikil, dan air yang dituang ke bekisting berisi besi tulangan. Beton sangat kuat menahan tekan, sedangkan besi menahan tarik — karena itu keduanya selalu dipakai bersama. Di sekolah, beton membentuk kerangka yang menopang seluruh beban dinding dan atap.",
    dipakaiDi: ["Kolom & balok ruang kelas", "Sloof dan pondasi", "Dak atap laboratorium", "Struktur tangga & koridor"],
    plus: ["Sangat kuat & tahan gempa (dengan tulangan benar)", "Tidak terbakar", "Umur pakai puluhan tahun"],
    minus: ["Berat, butuh bekisting", "Perlu curing 7–28 hari", "Retak bila campuran salah"],
  },
  {
    id: "kayu",
    nama: "Kayu Meranti",
    kategori: "Kusen",
    ukuran: "Balok 50 × 100 mm · papan 20 mm",
    u: 2.5,
    warna: "#a9743f",
    ringkas: "Kusen pintu-jendela, meja, dan papan tulis.",
    deskripsi:
      "Kayu meranti banyak dipakai karena mudah dikerjakan, ringan, dan harganya terjangkau. Sebelum dipakai, kayu dikeringkan (KD) agar tidak menyusut setelah terpasang, lalu dilapis cat atau politur. Konduktivitas panasnya rendah sehingga gagang pintu dan kusen tidak terasa panas.",
    dipakaiDi: ["Kusen pintu & jendela kelas", "Meja dan kursi siswa", "Papan tulis berbingkai", "Lisplang dan railing"],
    plus: ["Ringan & mudah dibentuk", "Terasa hangat, tidak menghantarkan panas", "Bisa diperbaiki di tempat"],
    minus: ["Rentan rayap & jamur", "Bisa melengkung bila lembap", "Perlu perawatan cat berkala"],
  },
  {
    id: "kaca",
    nama: "Kaca Bening",
    kategori: "Bukaan",
    ukuran: "Tebal 5 mm · lembaran",
    u: 5.8,
    warna: "#9fc7d8",
    ringkas: "Jendela kelas — masuknya cahaya, panas, dan udara.",
    deskripsi:
      "Kaca lembaran dibuat dari pasir silika yang dilebur pada ±1500 °C. Di kelas, kaca adalah dua sisi mata uang: meneruskan cahaya alami sehingga lampu bisa dihemat, tetapi juga meneruskan panas matahari (nilai U 5,8 W/m²K — tertinggi di daftar ini). Karena itu luas jendela, orientasi, dan keteduhan sangat menentukan suhu ruangan.",
    dipakaiDi: ["Jendela ruang kelas", "Pintu kaca laboratorium", "Jendela ruang guru & TU", "Skylight koridor"],
    plus: ["Meneruskan cahaya alami", "Tampilan luas dan bersih", "Mudah dibersihkan"],
    minus: ["Menghantarkan panas paling besar", "Rentan pecah", "Perlu kusen dan kedap air bagus"],
  },
  {
    id: "gypsum",
    nama: "Papan Gypsum",
    kategori: "Plafon",
    ukuran: "1200 × 2400 × 9 mm",
    u: null,
    warna: "#efece4",
    ringkas: "Plafon kelas: ringan, rata, dan cepat dipasang.",
    deskripsi:
      "Gypsum adalah kalsium sulfat yang dipadatkan di antara dua lapis kertas. Dipasang dengan sekrup pada rangka hollow atau baja ringan, lalu sambungannya didempul dan di-finishing. Plafon gypsum menutup rangka atap sehingga ruangan terlihat rapi dan panas atap tidak langsung terasa.",
    dipakaiDi: ["Plafon ruang kelas", "Plafon ruang guru", "Partisi ringan antarruang", "Plafon laboratorium"],
    plus: ["Ringan dan rata", "Cepat dipasang", "Membantu menahan panas atap"],
    minus: ["Tidak tahan air (kecuali tipe moisture resistant)", "Mudah berlubang", "Sambungan harus rapi agar tidak retak"],
  },
  {
    id: "baja_ringan",
    nama: "Baja Ringan C75",
    kategori: "Atap",
    ukuran: "C75 × 35 × 0,75 mm",
    u: null,
    warna: "#b9c2c9",
    ringkas: "Rangka atap dan partisi — pengganti kayu yang anti rayap.",
    deskripsi:
      "Profil baja canai dingin berbentuk huruf C, dipakai sebagai kuda-kuda atap atau rangka partisi. Bobotnya ringan tetapi kuat, tidak dimakan rayap, dan tidak melengkung karena kelembapan. Sambungannya memakai baut self-drilling, bukan paku.",
    dipakaiDi: ["Rangka atap ruang kelas", "Rangka plafon gypsum", "Kanopi koridor", "Rangka dinding partisi"],
    plus: ["Anti rayap & anti lapuk", "Ringan, tidak membebani struktur", "Pemasangan cepat & presisi"],
    minus: ["Bunyi berisik saat hujan", "Perlu pelapis anti karat", "Tidak bisa dipaku sembarangan"],
  },
  {
    id: "keramik",
    nama: "Keramik Lantai",
    kategori: "Lantai",
    ukuran: "300 × 300 mm atau 400 × 400 mm",
    u: null,
    warna: "#cfc7b8",
    ringkas: "Penutup lantai kelas — mudah dibersihkan dan tidak berdebu.",
    deskripsi:
      "Keramik adalah lempung yang dibakar dengan lapisan glasir di permukaannya. Dipasang dengan mortar perekat di atas screed beton, dengan nat 2–3 mm. Permukaannya dingin dan mudah dipel, cocok untuk ruangan dengan banyak siswa. Kode PEI menentukan ketahanan ausnya.",
    dipakaiDi: ["Lantai ruang kelas", "Koridor sekolah", "Kantin", "Toilet & ruang UKS"],
    plus: ["Mudah dibersihkan", "Tidak menahan debu", "Tahan air & gores"],
    minus: ["Terasa dingin di kaki", "Licin bila basah (pilih tekstur kasar)", "Bisa retak bila ada benda berat jatuh"],
  },
  {
    id: "seng",
    nama: "Seng Gelombang",
    kategori: "Atap",
    ukuran: "Tebal 0,25–0,4 mm · gelombang 76 mm",
    u: null,
    warna: "#9aa6ae",
    ringkas: "Atap murah yang cepat pasang, tapi paling menyalurkan panas.",
    deskripsi:
      "Lembaran baja tipis berlapis seng atau zincalume, dibentuk gelombang agar kaku. Gelombangnya juga menjadi saluran air hujan. Karena tipis dan logam, seng menyerap panas matahari dengan cepat lalu memancarkannya ke plafon — ruangan di bawahnya bisa jauh lebih panas bila tidak ada plafon dan ventilasi atap.",
    dipakaiDi: ["Atap kelas lama", "Atap kanopi & selasar", "Gudang sekolah", "Atap kantin terbuka"],
    plus: ["Murah dan ringan", "Pemasangan cepat", "Tahan air hujan"],
    minus: ["Panas & berisik saat hujan", "Mudah berkarat di udara lembap", "Butuh plafon untuk kenyamanan"],
  },
  {
    id: "triplek",
    nama: "Kayu Lapis (Triplek)",
    kategori: "Kusen",
    ukuran: "1220 × 2440 × 9 mm",
    u: null,
    warna: "#c08f5a",
    ringkas: "Daun pintu, lemari kelas, dan papan pengumuman.",
    deskripsi:
      "Triplek dibuat dari beberapa lapis venir kayu yang direkatkan bersilang arah serat, sehingga lebih stabil dari papan kayu utuh. Sisi tepinya terlihat berlapis. Di sekolah sering dipakai untuk daun pintu, badan lemari, dan papan display karena ringan dan mudah dibentuk.",
    dipakaiDi: ["Daun pintu kelas", "Lemari & rak buku", "Papan pengumuman koridor", "Sketsel pembatas"],
    plus: ["Ringan & rata", "Tidak mudah melengkung", "Murah dan mudah dipotong"],
    minus: ["Tepi mudah menyerap air", "Kurang kuat untuk struktur", "Perlu finis agar tahan lama"],
  },
];

export const KATEGORI: Kategori[] = ["Dinding", "Struktur", "Atap", "Plafon", "Lantai", "Bukaan", "Kusen"];

export function cariBahan(id: string): Bahan {
  return BAHAN.find((b) => b.id === id) ?? BAHAN[0];
}
