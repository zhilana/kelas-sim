"use client";

import { useMemo, useRef, useState } from "react";
import {
  MEJA_GURU,
  MEJA_SISWA,
  panjangDinding,
  posisiMejaGuru,
  setengahZonaPapan,
  type JendelaUnit,
  type PosisiJendela,
  type PosisiPintu,
  type TitikMeja,
} from "@/lib/model";

/**
 * Denah 2D yang bisa DIEDIT (tampak atas): geser meja, klik meja untuk
 * ganti kapasitas 1↔2 orang, tambah/hapus meja, geser pintu (pindah dinding
 * pun bisa), dan geser jendela sepanjang dindingnya. Semuanya snap kisi
 * 0,25 m dan tidak bisa keluar dinding.
 *
 * Semua angka yang digambar (tataLetak, pintu, posisi jendela) datang dari
 * lib/model — denah tidak bisa beda cerita dengan kelas 3D.
 */

/** skala gambar: px per meter */
const S = 34;
/** jarak tepi viewBox sekeliling (untuk label dimensi) */
const MARGIN = 26;
/** snap kisi editor (m) */
const SNAP = 0.25;
/** jarak minimum antarpusat jendela (m) */
const JENDEL_MIN = 1.5;
/** setengah lebar pinggiran jendela yang digambar (m) */
const JENDEL_SETENGAH = 0.63;
/** setengah lebar pintu (m) */
const PINTU_SETENGAH = 0.47;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type AlatDenah = "geser" | "tambah" | "hapus";

export interface DenahInteraksi {
  /** tool aktif: geser (drag+klik kap), tambah (klik kosong), hapus */
  alat: AlatDenah;
  /** dipanggil saat meja digeser (sudah snap & dijepit dalam dinding) */
  onPindahMeja: (idx: number, x: number, z: number) => void;
  /** klik meja pada alat "geser" — ganti kapasitas 1↔2 orang */
  onKapMeja: (idx: number) => void;
  onTambahMeja: (x: number, z: number) => void;
  onHapusMeja: (idx: number) => void;
  /** pintu digeser / pindah dinding */
  onPindahPintu: (p: PosisiPintu) => void;
  /** jendela i digeser langsung / pindah dinding (unit {sisi, offset} baru) */
  onPindahJendela: (idx: number, unit: JendelaUnit) => void;
}

export default function Denah({
  panjang,
  lebar,
  bukaanPct,
  tataLetak,
  tabrakan = false,
  pintu,
  jendelaUnits,
  interaksi,
}: {
  panjang: number; // sumbu x (m) — papan tulis ada di sisi z negatif (atas)
  lebar: number; // sumbu z (m)
  bukaanPct: number;
  tataLetak: TitikMeja[];
  /** true = kursi menabrak meja belakang: gambar meja merah */
  tabrakan?: boolean;
  pintu?: PosisiPintu;
  /** Ketat unit tiap jendela: dinding + koordinat pusatnya (dari lib/model). */
  jendelaUnits: JendelaUnit[];
  /** bila ada → denah jadi editor interaktif */
  interaksi?: DenahInteraksi;
}) {
  const w = panjang * S;
  const h = lebar * S;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [geser, setGeser] = useState<{
    jenis: "meja" | "pintu" | "jendela";
    idx: number;
  } | null>(null);

  const guru = useMemo(() => posisiMejaGuru(panjang, lebar), [panjang, lebar]);
  const zonaPapan = useMemo(() => setengahZonaPapan(panjang), [panjang]);

  /** model → kanvas */
  const sx = (x: number) => x * S + w / 2;
  const sz = (z: number) => z * S + h / 2;

  // Jendela: unit langsung dari lib/model (sudah dijaga zona papan & dinding).
  const jend = jendelaUnits;

  const terbuka = clamp(bukaanPct, 0, 100) / 100;

  /* ---------------- koordinat pointer → meter model ---------------- */
  const keMeter = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    // getScreenCTM memetakan user units → layar; ke baliknya (layar → user)
    // harus lewat .inverse(), bukan matriks maju.
    const m = pt.matrixTransform(ctm.inverse());
    // m berada di ruang user = koordinat svg (0..w) tereksakto — MIS-nya
    // viewBox hanya menandai area kanvas, bukan menggeser value.
    return { x: (m.x - w / 2) / S, z: (m.y - h / 2) / S };
  };

  /** jepit sumbu & kisi; dipisah per sumbu untuk magnet. */
  const jepitX = (x: number, hw: number) =>
    clamp(snap(x), -panjang / 2 + hw + 0.06, panjang / 2 - hw - 0.06);
  const jepitZ = (z: number) => clamp(snap(z), -lebar / 2 + 0.45, lebar / 2 - 0.62);
  const jepitMeja = (x: number, z: number, kap: 1 | 2 | undefined) => {
    const hw = (kap === 2 ? 1.26 : MEJA_SISWA.lebar) / 2;
    return { x: jepitX(x, hw), z: jepitZ(z) };
  };

  /**
   * Magnet "sejajar tetangga": saat menyeret meja, sumbu yang datang dekat
   * (≤ 0,4 m) dengan meja lain dikunci ke koordinat tetangga persis.
   * Pitch otomatis bukan kelipatan kisi 0,25 m, jadi tanpa magnet meja yang
   * digeser tidak pernah bisa lurus sejajar tetangganya.
   */
  const magnet = (v: number, sumbu: "x" | "z", i: number): number | null => {
    let terdekat: number | undefined;
    let d = Infinity;
    tataLetak.forEach((t, j) => {
      if (j === i) return;
      const dd = Math.abs(t[sumbu] - v);
      if (dd < d) {
        d = dd;
        terdekat = t[sumbu];
      }
    });
    return terdekat !== undefined && d <= 0.4 ? terdekat : null;
  };

  /* ---------------- handler drag / klik ---------------- */
  const titikMulai = useRef<{ x: number; y: number } | null>(null);

  const mulaiMeja = (e: React.PointerEvent, i: number) => {
    if (!interaksi) return;
    if (interaksi.alat === "hapus") {
      interaksi.onHapusMeja(i);
      return;
    }
    if (interaksi.alat !== "geser") return;
    e.stopPropagation();
    // setPointerCapture bisa menolak pointer sintetis/sistem sekunder —
    // gagal pun drag tetap harus jalan (event move tetap didengar node ini).
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* tak apa: tanpa capture pun drag bekerja selama pointer tetap di atas */
    }
    titikMulai.current = { x: e.clientX, y: e.clientY };
    setGeser({ jenis: "meja", idx: i });
  };

  const gerakMeja = (e: React.PointerEvent, i: number) => {
    if (!interaksi || geser?.jenis !== "meja" || geser.idx !== i) return;
    const m = keMeter(e);
    if (!m) return;
    const hw = (tataLetak[i]?.kap === 2 ? 1.26 : MEJA_SISWA.lebar) / 2;
    const mx = magnet(m.x, "x", i);
    const mz = magnet(m.z, "z", i);
    // sumbu yang magnet: kunci ke tetangga (Hitung clamp saja, tanpa snap) —
    // sumbu bebas: kisi 0,25 m seperti biasa.
    const x = mx !== null ? clamp(mx, -panjang / 2 + hw + 0.06, panjang / 2 - hw - 0.06) : jepitX(m.x, hw);
    const z = mz !== null ? clamp(mz, -lebar / 2 + 0.45, lebar / 2 - 0.62) : jepitZ(m.z);
    interaksi.onPindahMeja(i, x, z);
  };

  const selesaiMeja = (e: React.PointerEvent, i: number) => {
    if (!interaksi || geser?.jenis !== "meja" || geser.idx !== i) return;
    setGeser(null);
    // Klik tanpa geser (alat "geser") = beralih kapasitas 1↔2 orang.
    const jarak = titikMulai.current
      ? Math.hypot(e.clientX - titikMulai.current.x, e.clientY - titikMulai.current.y)
      : 0;
    titikMulai.current = null;
    if (interaksi.alat === "geser" && jarak < 4) interaksi.onKapMeja(i);
  };

  const klikLantai = (e: React.PointerEvent) => {
    if (!interaksi || interaksi.alat !== "tambah") return;
    const m = keMeter(e);
    if (!m) return;
    const { x, z } = jepitMeja(m.x, m.z, 1);
    interaksi.onTambahMeja(x, z);
  };

  /* -------- pintu: drag sepanjang dinding, bisa pindah dinding -------- */
  const mulaiPintu = (e: React.PointerEvent) => {
    if (!interaksi || !pintu || interaksi.alat !== "geser") return;
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* lihat mulaiMeja */
    }
    setGeser({ jenis: "pintu", idx: 0 });
  };

  const gerakPintu = (e: React.PointerEvent) => {
    if (!interaksi || !pintu || geser?.jenis !== "pintu") return;
    const m0 = keMeter(e);
    if (!m0) return;
    // Pointer boleh licin keluar dinding — clamp dulu ke dalam ruangan
    // supaya "dekat dinding kanan" tetap terbaca walau pointernya lewat.
    const m = {
      x: Math.max(-panjang / 2, Math.min(panjang / 2, m0.x)),
      z: Math.max(-lebar / 2, Math.min(lebar / 2, m0.z)),
    };
    // dinding terdekat dari posisi pointer
    const dWalls: [PosisiJendela, number][] = [
      ["belakang", Math.abs(lebar / 2 - m.z)],
      ["depan", Math.abs(m.z + lebar / 2)],
      ["kiri", Math.abs(m.x + panjang / 2)],
      ["kanan", Math.abs(panjang / 2 - m.x)],
    ];
    dWalls.sort((a, b) => a[1] - b[1]);
    const terdekat = dWalls[0];
    // hanya pindah dinding kalau pointernya nyata dekat dinding lain
    let sisi = pintu.sisi;
    if (terdekat[0] !== pintu.sisi && terdekat[1] < 0.9)
      sisi = terdekat[0];
    const len = panjangDinding(sisi, panjang, lebar);
    let offset = clamp(
      snap(sisi === "kiri" || sisi === "kanan" ? m.z + lebar / 2 : m.x + panjang / 2),
      0.55,
      len - 0.55,
    );
    // pintu & jendela bisa dua-duanya di satu dinding — pisahkan kantung,
    // jangan sampai pintu berdiri di dalam lubang jendela
    const jendSama = jend.filter((u) => u.sisi === sisi);
    for (const u of jendSama) {
      const wC = u.offset + len / 2; // koordinat jendela ke konvensi 0..len
      if (Math.abs(offset - wC) < 1.2) offset = offset < wC ? wC - 1.2 : wC + 1.2;
    }
    offset = clamp(offset, 0.55, len - 0.55);
    interaksi.onPindahPintu({ sisi, offset });
  };

  const selesaiPintu = () => geser && setGeser(null);

  /* -------- jendela: drag sepanjang dinding jendelanya -------- */
  const mulaiJendela = (e: React.PointerEvent, i: number) => {
    if (!interaksi) return;
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* lihat mulaiMeja */
    }
    setGeser({ jenis: "jendela", idx: i });
  };

  const gerakJendela = (e: React.PointerEvent, i: number) => {
    if (!interaksi || geser?.jenis !== "jendela" || geser.idx !== i) return;
    const m0 = keMeter(e);
    if (!m0) return;
    // pointer boleh licin keluar dinding — clamp ke dalam ruangan dulu,
    // supaya "dekat dinding kanan" tetap terbaca walau pointernya lewat.
    const m = {
      x: Math.max(-panjang / 2, Math.min(panjang / 2, m0.x)),
      z: Math.max(-lebar / 2, Math.min(lebar / 2, m0.z)),
    };
    // jendela boleh pindah dinding: bila pointer sangat dekat dinding lain,
    // dia pindah ke sana (macam pintu). Semua dinding sah tujuan.
    const dWalls: [JendelaUnit["sisi"], number][] = [
      ["belakang", Math.abs(lebar / 2 - m.z)],
      ["depan", Math.abs(m.z + lebar / 2)],
      ["kiri", Math.abs(m.x + panjang / 2)],
      ["kanan", Math.abs(panjang / 2 - m.x)],
    ];
    dWalls.sort((a, b) => a[1] - b[1]);
    let sisi = jend[i].sisi;
    if (dWalls[0][0] !== sisi && dWalls[0][1] < 0.9) sisi = dWalls[0][0];
    const len = panjangDinding(sisi, panjang, lebar);
    let c = clamp(
      snap(sisi === "kiri" || sisi === "kanan" ? m.z : m.x),
      -len / 2 + 0.7,
      len / 2 - 0.7,
    );
    // dinding depan: jangan tembus zona papan tulis
    if (sisi === "depan") {
      const atas = zonaPapan + JENDEL_SETENGAH + 0.05;
      if (Math.abs(c) < atas) c = c < 0 ? -atas : atas;
    }
    // jaga jarak antar tetangga pada dinding yang SAMA saja
    const lain = jend.filter((_, k) => k !== i && jend[k].sisi === sisi).map((j) => j.offset);
    const kiri = Math.max(...lain.filter((v) => v < c), -Infinity);
    const kanan = Math.min(...lain.filter((v) => v > c), Infinity);
    c = Math.max(kiri + JENDEL_MIN, Math.min(kanan - JENDEL_MIN, c));
    // jangan buang diri di kantung pintu (dinding yang sama dengan pintu)
    if (pintu && sisi === pintu.sisi) {
      const lenP = panjangDinding(pintu.sisi, panjang, lebar);
      const doorC = pintu.offset - lenP / 2;
      if (Math.abs(c - doorC) < 1.2) c = c < doorC ? doorC - 1.2 : doorC + 1.2;
      c = clamp(c, -len / 2 + 0.7, len / 2 - 0.7);
    }
    interaksi.onPindahJendela(i, { sisi, offset: c });
  };

  const selesaiJendela = () => geser && setGeser(null);

  const edit = !!interaksi;

  return (
    <svg
      ref={svgRef}
      viewBox={`${-MARGIN} ${-MARGIN} ${w + 2 * MARGIN} ${h + 2 * MARGIN}`}
      className="h-full w-full touch-none select-none"
      role="img"
      aria-label="Denah ruangan dari atas"
      onPointerDown={klikLantai}
    >
      <defs>
        <pattern id="denah-grid" width={S / 2} height={S / 2} patternUnits="userSpaceOnUse">
          <path
            d={`M ${S / 2} 0 L 0 0 0 ${S / 2}`}
            fill="none"
            stroke={edit ? "var(--color-line-strong)" : "var(--color-line)"}
            strokeWidth={edit ? 1.4 : 1}
          />
        </pattern>
      </defs>

      {/* lantai + kisi */}
      <rect x="0" y="0" width={w} height={h} rx="6" fill="var(--color-panel)" />
      <rect x="0" y="0" width={w} height={h} rx="6" fill="url(#denah-grid)" />
      <rect x="0" y="0" width={w} height={h} rx="6" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" />

      {/* papan tulis: dinding depan (z = -lebar/2, atas) — lebar SAMA dengan
          mesh papan tulis 3D (min(L*0.55, 3.2)) biar zona jendela konsisten */}
      <line
        x1={sx(-Math.min(panjang * 0.55, 3.2) / 2)}
        x2={sx(Math.min(panjang * 0.55, 3.2) / 2)}
        y1={sz(-lebar / 2) + 3}
        y2={sz(-lebar / 2) + 3}
        stroke="var(--color-ink)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* dinding berjendela */}
      <DindingJendela
        jend={jend}
        terbuka={terbuka}
        sx={sx}
        sz={sz}
        w={w}
        h={h}
        edit={edit}
        geser={geser}
        mulaiJendela={mulaiJendela}
        gerakJendela={gerakJendela}
        selesaiJendela={selesaiJendela}
      />

      {/* pintu: DEAD di dinding pintu.sisi */}
      {pintu && <Pintu pintu={pintu} L={panjang} W={lebar} sx={sx} sz={sz} edit={edit} geser={geser} mulaiPintu={mulaiPintu} gerakPintu={gerakPintu} selesaiPintu={selesaiPintu} />}

      {/* meja guru: pojok depan */}
      <rect
        x={sx(guru.x) - (MEJA_GURU.lebar * S) / 2}
        y={sz(guru.z) - (MEJA_GURU.dalam * S) / 2}
        width={MEJA_GURU.lebar * S}
        height={MEJA_GURU.dalam * S}
        rx="3"
        fill="color-mix(in srgb, var(--color-warn) 55%, transparent)"
        stroke="var(--color-warn)"
        strokeWidth="1"
      />

      {/* meja siswa — draggable saat edit */}
      {tataLetak.map((t, i) => {
        const hw = (t.kap === 2 ? 1.26 : MEJA_SISWA.lebar) / 2;
        const kena =
          tabrakan ||
          (geser?.jenis === "meja" && geser.idx === i);
        return (
          <g
            key={i}
            data-denah-meja={i}
            data-kap={t.kap ?? 1}
            onPointerDown={(e) => mulaiMeja(e, i)}
            onPointerMove={(e) => gerakMeja(e, i)}
            onPointerUp={(e) => selesaiMeja(e, i)}
            style={{ cursor: edit ? (interaksi?.alat === "hapus" ? "not-allowed" : "grab") : "default" }}
          >
            <rect
              x={sx(t.x) - hw * S}
              y={sz(t.z) - (MEJA_SISWA.dalam * S) / 2}
              width={hw * 2 * S}
              height={MEJA_SISWA.dalam * S}
              rx="2"
              fill={
                kena
                  ? "color-mix(in srgb, var(--color-hot) 16%, transparent)"
                  : "color-mix(in srgb, var(--color-accent) 13%, transparent)"
              }
              stroke={
                kena
                  ? "color-mix(in srgb, var(--color-hot) 45%, transparent)"
                  : "color-mix(in srgb, var(--color-accent) 40%, transparent)"
              }
              strokeWidth="0.8"
            />
            {t.kap === 2 && (
              <line
                x1={sx(t.x)}
                x2={sx(t.x)}
                y1={sz(t.z) - (MEJA_SISWA.dalam * S) / 2}
                y2={sz(t.z) + (MEJA_SISWA.dalam * S) / 2}
                stroke="color-mix(in srgb, var(--color-accent) 55%, transparent)"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
            )}
          </g>
        );
      })}

      {/* label dimensi */}
      <text x={w / 2} y={h + MARGIN - 8} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
        panjang {panjang.toLocaleString("id-ID")} m
      </text>
      <text
        x={-MARGIN + 8}
        y={h / 2}
        textAnchor="middle"
        fontSize="10"
        fill="var(--color-muted)"
        transform={`rotate(-90 ${-MARGIN + 8} ${h / 2})`}
      >
        {lebar.toLocaleString("id-ID")} m
      </text>
    </svg>
  );
}

/** Kotak jendela live di dinding SISI masing-masing; draggable saat edit. */
function DindingJendela({
  jend,
  terbuka,
  sx,
  sz,
  w,
  h,
  edit,
  geser,
  mulaiJendela,
  gerakJendela,
  selesaiJendela,
}: {
  jend: JendelaUnit[];
  terbuka: number;
  sx: (x: number) => number;
  sz: (z: number) => number;
  w: number;
  h: number;
  edit: boolean;
  geser: { jenis: string; idx: number } | null;
  mulaiJendela: (e: React.PointerEvent, i: number) => void;
  gerakJendela: (e: React.PointerEvent, i: number) => void;
  selesaiJendela: () => void;
}) {
  const tebal = 9;
  const kotak = (j: JendelaUnit) => {
    const len = JENDEL_SETENGAH * 2 * S;
    if (j.sisi === "kiri") return { x: 0, y: sz(j.offset) - len / 2, width: tebal, height: len };
    if (j.sisi === "kanan") return { x: w - tebal, y: sz(j.offset) - len / 2, width: tebal, height: len };
    if (j.sisi === "depan") return { x: sx(j.offset) - len / 2, y: 0, width: len, height: tebal };
    return { x: sx(j.offset) - len / 2, y: h - tebal, width: len, height: tebal };
  };

  return (
    <g>
      {jend.map((j, i) => {
        const k = kotak(j);
        const horizontal = k.width > k.height;
        const buka = (horizontal ? k.width : k.height) * terbuka;
        const aktif = geser?.jenis === "jendela" && geser.idx === i;
        return (
          <g
            key={i}
            data-denah-jendela={i}
            data-jendela-sisi={j.sisi}
            onPointerDown={edit ? (e) => mulaiJendela(e, i) : undefined}
            onPointerMove={edit ? (e) => gerakJendela(e, i) : undefined}
            onPointerUp={edit ? selesaiJendela : undefined}
            style={{ cursor: edit ? "grab" : "default" }}
          >
            <rect {...k} rx="2" fill="var(--color-line-strong)" />
            <rect
              x={k.x}
              y={k.y}
              width={horizontal ? buka : k.width}
              height={horizontal ? k.height : buka}
              rx="2"
              fill="var(--color-accent)"
              opacity={aktif ? 0.85 : 1}
            />
          </g>
        );
      })}
    </g>
  );
}

/** Pintu di satu dinding; draggable + bisa pindah dinding saat edit. */
function Pintu({
  pintu,
  L,
  W,
  sx,
  sz,
  edit,
  geser,
  mulaiPintu,
  gerakPintu,
  selesaiPintu,
}: {
  pintu: PosisiPintu;
  L: number;
  W: number;
  sx: (x: number) => number;
  sz: (z: number) => number;
  edit: boolean;
  geser: { jenis: string } | null;
  mulaiPintu: (e: React.PointerEvent) => void;
  gerakPintu: (e: React.PointerEvent) => void;
  selesaiPintu: () => void;
}) {
  const len = panjangDinding(pintu.sisi, L, W);
  const awal = pintu.sisi === "belakang" || pintu.sisi === "depan" ? -L / 2 : -W / 2;
  const c = awal + pintu.offset;
  const aktif = geser?.jenis === "pintu";
  const hw = PINTU_SETENGAH * S;
  const lebarPintu = 8;

  let rect: { x: number; y: number; width: number; height: number };
  if (pintu.sisi === "belakang") rect = { x: sx(c) - hw, y: W * S - lebarPintu, width: hw * 2, height: lebarPintu };
  else if (pintu.sisi === "depan") rect = { x: sx(c) - hw, y: 0, width: hw * 2, height: lebarPintu };
  else if (pintu.sisi === "kiri") rect = { x: 0, y: sz(c) - hw, width: lebarPintu, height: hw * 2 };
  else rect = { x: L * S - lebarPintu, y: sz(c) - hw, width: lebarPintu, height: hw * 2 };
  void len;

  return (
    <g
      data-denah-pintu=""
      onPointerDown={edit ? mulaiPintu : undefined}
      onPointerMove={edit ? gerakPintu : undefined}
      onPointerUp={edit ? selesaiPintu : undefined}
      style={{ cursor: edit ? "grab" : "default" }}
    >
      <rect
        {...rect}
        rx="2"
        fill={aktif ? "var(--color-hot)" : "var(--color-ink)"}
        opacity={aktif ? 0.9 : 0.75}
      />
      {/* tie handle lebih luas biar mudah dipegang */}
      <rect {...rect} fill="transparent" />
    </g>
  );
}
