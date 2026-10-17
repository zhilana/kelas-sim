"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Fokus } from "@/lib/model";

export interface SceneCanvasProps {
  panjang: number;
  lebar: number;
  tinggi: number;
  layout: { x: number; z: number }[];
  jumlahMeja: number;
  jumlahKursi: number;
  jumlahJendela: number;
  posisiJendela: string;
  debit: number;
  hotFactor: number;
  fokus: Fokus | null;
  /** Persen bukaan jendela (0–100): daun jendela berputar + ventilasi partikel. */
  bukaanPct?: number;
  /** Jumlah kipas plafon yang dirender (maks 3 di scene). */
  jumlahKipas?: number;
}

export type CamId = "orbit" | "depan" | "atas" | "samping" | "dalam";

interface Refs {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  glows: Partial<Record<Fokus, { mat: THREE.MeshStandardMaterial; target: number }[]>>;
  edges?: THREE.LineBasicMaterial;
  pointsMat?: THREE.PointsMaterial;
  sun?: THREE.DirectionalLight;
  fans: THREE.Group[];
  leaves: { pivot: THREE.Group; openRotY: number }[];
  camTween: {
    t: number; dur: number;
    fromPos: THREE.Vector3; toPos: THREE.Vector3;
    fromTgt: THREE.Vector3; toTgt: THREE.Vector3;
  } | null;
  speedTarget: number;
  speedCur: number;
  dir: THREE.Vector3;
  intro: { t: number; from: THREE.Vector3; to: THREE.Vector3 };
  raf: number;
  clock: THREE.Clock;
  observer?: ResizeObserver;
  disposeCamEvt: () => void;
}

const WALL_T = 0.14;

/* ============================ util tekstur ============================ */

/** Lantai terang khas kelas (ubin putih dengan nat abu). */
function checkerTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#d9dade";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#b8bcc4";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 253, 253);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Papan tulis hijau dengan tulisan kapur. */
function papanTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2c5a44";
  g.fillRect(0, 0, 1024, 320);
  // bekas hapusan kapur
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    g.beginPath();
    g.ellipse(Math.random() * 1024, Math.random() * 320, 30 + Math.random() * 90, 10 + Math.random() * 26, Math.random() * 3, 0, 7);
    g.fill();
  }
  g.fillStyle = "#eef4ec";
  g.font = "bold 54px Georgia, serif";
  g.fillText("Selamat Belajar!", 60, 90);
  g.strokeStyle = "#eef4ec";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(58, 112);
  g.lineTo(430, 112);
  g.stroke();
  g.font = "44px Georgia, serif";
  g.fillText("Q ≈ Cd · A · v", 60, 190);
  g.fillText("V = p × l × t", 60, 258);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function labelSprite(text: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(20,26,24,.85)";
  g.fillRect(6, 10, 500, 76);
  g.strokeStyle = "#e8f2ea";
  g.lineWidth = 3;
  g.strokeRect(6, 10, 500, 76);
  g.fillStyle = "#f4faf5";
  g.font = "bold 38px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(1.7, 0.32, 1);
  sp.renderOrder = 10;
  return sp;
}

/* ============================ komponen ============================ */

export default function SceneCanvas(props: SceneCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const refsRef = useRef<Refs | null>(null);
  const live = useRef(props); // nilai props terbaru tanpa rebuild scene
  live.current = props;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---- Refs + renderer (sekali per build) ----
    const R: Refs = {
      renderer: new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }),
      camera: new THREE.PerspectiveCamera(52, 1, 0.1, 200),
      controls: null as unknown as OrbitControls,
      glows: {},
      fans: [],
      leaves: [],
      camTween: null,
      speedTarget: 1,
      speedCur: 1,
      dir: new THREE.Vector3(1, 0, 0),
      intro: { t: 0, from: new THREE.Vector3(), to: new THREE.Vector3() },
      raf: 0,
      clock: new THREE.Clock(),
      disposeCamEvt: () => {},
    };
    refsRef.current = R;

    const { panjang: L, lebar: W, tinggi: H } = props;
    const scene = new THREE.Scene();
    // Langit siang cerah di luar jendela.
    scene.background = new THREE.Color("#b9d2e8");
    scene.fog = new THREE.Fog(0xb9d2e8, Math.max(L, W) * 3.2, Math.max(L, W) * 6.5);

    R.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    R.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    R.renderer.toneMappingExposure = 1.45;
    R.renderer.shadowMap.enabled = true;
    R.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(R.renderer.domElement);

    /* ---------- cahaya ---------- */
    scene.add(new THREE.AmbientLight(0xfff6ea, 0.75));
    scene.add(new THREE.HemisphereLight(0xcfe0f5, 0x8a7d68, 1.5));
    const sun = new THREE.DirectionalLight(0xfff3dd, 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    const shadowSpan = Math.max(L, W) * 1.1;
    Object.assign(sun.shadow.camera, {
      left: -shadowSpan, right: shadowSpan, top: shadowSpan, bottom: -shadowSpan,
    });
    R.sun = sun;
    scene.add(sun, sun.target);

    /* ---------- grup fokus ---------- */
    const G = {
      lantai: new THREE.Group(),
      volume: new THREE.Group(),
      jendela: new THREE.Group(),
      siswa: new THREE.Group(),
      udara: new THREE.Group(),
      matahari: new THREE.Group(),
      dinding: new THREE.Group(),
      suhu: new THREE.Group(),
    };
    Object.values(G).forEach((g) => scene.add(g));

    const std = (color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.04, ...o });

    /** Daftarkan material agar bisa "menyala biru" saat fokus aktif. */
    const glow = (f: Fokus, mat: THREE.MeshStandardMaterial, target: number) => {
      mat.emissive = new THREE.Color(0x2563eb);
      mat.emissiveIntensity = 0;
      (R.glows[f] ??= []).push({ mat, target });
    };

    /** Mesh standar: menerima & melempar bayangan. */
    const box = (
      parent: THREE.Object3D,
      w: number, h: number, d: number,
      x: number, y: number, z: number,
      mat: THREE.Material,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    /* ---------- lantai ---------- */
    const floorTex = checkerTexture();
    floorTex.repeat.set(Math.max(2, Math.round(L / 2)), Math.max(2, Math.round(W / 2)));
    const floorMat = std(0xffffff, { map: floorTex, roughness: 0.55 });
    glow("lantai", floorMat, 0.35);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, W), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.001;
    floor.receiveShadow = true;
    G.lantai.add(floor);

    /* ---------- langit-langit + kipas plafon ---------- */
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(L, W), std(0xe8e6df, { roughness: 0.95 }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = H;
    ceil.receiveShadow = true;
    G.dinding.add(ceil);

    // Kipas plafon: tiang + hub + 3 bilah, diputar di loop animasi.
    const fanMat = std(0x8b8f96, { metalness: 0.5, roughness: 0.4 });
    const bladeMat = std(0xcfd3d9, { roughness: 0.45 });
    const nFan = Math.min(3, Math.max(0, props.jumlahKipas ?? 2));
    const fanXs = [-L / 4, L / 4];
    for (let i = 0; i < nFan; i++) {
      const fan = new THREE.Group();
      const fx = nFan === 1 ? 0 : fanXs[i % 2];
      const fz = nFan === 1 ? 0 : i < 2 ? 0 : W / 5;
      const rodLen = 0.42;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, rodLen, 8), fanMat);
      rod.position.y = H - rodLen / 2;
      rod.castShadow = true;
      fan.add(rod);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 16), fanMat);
      hub.position.y = H - rodLen - 0.06;
      hub.castShadow = true;
      fan.add(hub);
      const blades = new THREE.Group();
      blades.position.y = H - rodLen - 0.08;
      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 0.17), bladeMat);
        blade.position.x = 0.62;
        const holder = new THREE.Group();
        holder.rotation.y = (b * Math.PI * 2) / 3;
        holder.add(blade);
        blades.add(holder);
      }
      fan.add(blades);
      fan.position.set(fx, 0, fz);
      R.fans.push(blades);
      G.dinding.add(fan);
    }

    /* ---------- dinding dengan lubang jendela ---------- */
    type Opening = { c: number; w: number; y0: number; y1: number };

    /** Satu jendela: bingkai + daun casement (engsel kiri) + sil + glow luar. */
    function addJendela(pos: THREE.Vector3, rotY: number, w: number, h: number) {
      const grp = new THREE.Group();
      const frameMat = std(0x3c4048, { roughness: 0.4 });
      box(grp, w + 0.14, h + 0.14, 0.1, 0, 0, 0, frameMat);
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xa8c8e0, transparent: true, opacity: 0.28, roughness: 0.15, metalness: 0.15, side: THREE.DoubleSide,
      });
      glow("jendela", glassMat, 1.1);
      glow("matahari", glassMat, 0.9);

      // Daun casement: berengsel di sisi kiri, berputar mengikuti bukaan.
      const leafPivot = new THREE.Group();
      leafPivot.position.set(-w / 2, 0, 0.07);
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
      leaf.position.x = w / 2;
      leaf.castShadow = true;
      leafPivot.add(leaf);
      const barMat = std(0x565c66, { roughness: 0.5 });
      const barH = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, 0.03), barMat);
      barH.position.set(w / 2, 0, 0);
      leafPivot.add(barH);
      const barV = new THREE.Mesh(new THREE.BoxGeometry(0.045, h, 0.03), barMat);
      barV.position.set(w / 2, 0, 0);
      leafPivot.add(barV);
      grp.add(leafPivot);
      R.leaves.push({ pivot: leafPivot, openRotY: -Math.PI * 0.45 });

      // ambang
      box(grp, w + 0.26, 0.07, 0.18, 0, -h / 2 - 0.09, 0.09, std(0x30343c));
      // "cahaya langit" cerah di luar jendela
      const glowOut = new THREE.Mesh(
        new THREE.PlaneGeometry(w + 0.7, h + 0.7),
        new THREE.MeshBasicMaterial({ color: 0xdceaf8 }),
      );
      glowOut.position.z = -0.36;
      glowOut.renderOrder = -1;
      grp.add(glowOut);
      grp.position.copy(pos);
      grp.rotation.y = rotY;
      G.jendela.add(grp);
    }

    /** Dinding dengan lubang untuk tiap opening + garis aksen bawah. */
    function buildDinding(opts: {
      axis: "x" | "z"; // arah lintang dinding
      at: number; // koordinat permukaan dalam
      sgn: 1 | -1; // arah keluar ruangan
      len: number;
      openings: Opening[];
    }) {
      const { axis, at, sgn, len, openings } = opts;
      const mat = std(0xe3ddcf);
      glow("dinding", mat, 0.35);
      const grp = new THREE.Group();
      const mid = at + sgn * (WALL_T / 2);
      const seg = (a: number, b: number, y0: number, y1: number) => {
        const wSeg = b - a;
        if (wSeg < 0.02 || y1 - y0 < 0.02) return;
        const cx = axis === "x" ? (a + b) / 2 : mid;
        const cz = axis === "x" ? mid : (a + b) / 2;
        box(grp, axis === "x" ? wSeg : WALL_T, y1 - y0, axis === "x" ? WALL_T : wSeg, cx, (y0 + y1) / 2, cz, mat);
      };
      let cursor = -len / 2;
      for (const o of [...openings].sort((a, b) => a.c - b.c)) {
        seg(cursor, o.c - o.w / 2, 0, H);
        seg(o.c - o.w / 2, o.c + o.w / 2, 0, o.y0);
        seg(o.c - o.w / 2, o.c + o.w / 2, o.y1, H);
        cursor = o.c + o.w / 2;
      }
      seg(cursor, len / 2, 0, H);

      // cat bawah hijau tua khas dinding sekolah Indonesia
      const bandMat = std(0x1f5c46, { roughness: 0.85 });
      const skirtMat = std(0x8a8577);
      const off = at - sgn * 0.03;
      const bandGeoArgs =
        axis === "x"
          ? [len, 0.16, 0.05]
          : [0.05, 0.16, len];
      const band = new THREE.Mesh(new THREE.BoxGeometry(...bandGeoArgs), bandMat);
      band.position.set(axis === "x" ? 0 : off, 0.08, axis === "x" ? off : 0);
      band.receiveShadow = true;
      grp.add(band);
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(...(axis === "x" ? [len, 0.13, 0.06] : [0.06, 0.13, len])),
        skirtMat,
      );
      skirt.position.set(axis === "x" ? 0 : off, 0.065, axis === "x" ? off : 0);
      grp.add(skirt);

      G.dinding.add(grp);
      return grp;
    }

    // Sebar pusat jendela pada satu interval, muatkan lebar minimal.
    function sebar(n: number, lo: number, hi: number): { c: number; w: number }[] {
      let count = n;
      let step = (hi - lo) / count;
      while (count > 1 && step < 1.15) {
        count--;
        step = (hi - lo) / count;
      }
      const w = Math.min(1.5, step * 0.82);
      return Array.from({ length: count }, (_, i) => ({ c: lo + step * (i + 0.5), w }));
    }

    const nWin = Math.max(0, props.jumlahJendela);
    const posisi = props.posisiJendela as "kiri" | "kanan" | "depan" | "belakang";
    const openingsPerWall: Partial<Record<typeof posisi, Opening[]>> = {};
    const winYcSide = Math.min(H - 0.85, 1.95);
    const winH = Math.min(1.2, H * 0.4);

    if (nWin > 0) {
      if (posisi === "kiri" || posisi === "kanan") {
        const m = Math.max(1.15, W * 0.14);
        const wins = sebar(nWin, -W / 2 + m, W / 2 - m);
        openingsPerWall[posisi] = wins.map(({ c, w }) => ({
          c, w: w + 0.16, y0: winYcSide - winH / 2 - 0.09, y1: winYcSide + winH / 2 + 0.09,
        }));
        wins.forEach(({ c, w }, i) => {
          const x = posisi === "kiri" ? -L / 2 : L / 2;
          addJendela(new THREE.Vector3(x, winYcSide, c), posisi === "kiri" ? Math.PI / 2 : -Math.PI / 2, w, winH);
          if (i === 0) {
            sun.position.set(x * 2.2, H * 2.4, c);
            sun.target.position.set(0, 0, 0);
          }
        });
      } else if (posisi === "belakang") {
        const m = Math.max(1.9, L * 0.16); // beri ruang pintu di sudut
        const wins = sebar(nWin, -L / 2 + m, L / 2 - m);
        openingsPerWall.belakang = wins.map(({ c, w }) => ({
          c, w: w + 0.16, y0: winYcSide - winH / 2 - 0.09, y1: winYcSide + winH / 2 + 0.09,
        }));
        wins.forEach(({ c, w }, i) => {
          addJendela(new THREE.Vector3(c, winYcSide, W / 2), Math.PI, w, winH);
          if (i === 0) {
            sun.position.set(c, H * 2.4, W * 2.2);
            sun.target.position.set(0, 0, 0);
          }
        });
      } else {
        // Depan: baris jendela tinggi di kiri & kanan papan tulis.
        const bwHalf = Math.min(L * 0.25, 1.6); // setengah zona papan tulis
        const m = Math.max(0.9, L * 0.08);
        const sideW = L / 2 - m - bwHalf;
        const capPerSide = Math.max(0, Math.floor((sideW + 0.4) / 1.35));
        const want = Math.min(nWin, capPerSide * 2);
        const nKiri = Math.ceil(want / 2);
        const nKanan = want - nKiri;
        const ycDepan = Math.min(H - 0.72, 2.5);
        const hDepan = Math.min(1.05, H * 0.34);
        const mkSide = (n: number, lo: number, hi: number) =>
          n > 0 && hi - lo >= 1.2 ? sebar(n, lo, hi) : [];
        const wins = [
          ...mkSide(nKiri, -L / 2 + m, -bwHalf),
          ...mkSide(nKanan, bwHalf, L / 2 - m),
        ];
        openingsPerWall.depan = wins.map(({ c, w }) => ({
          c, w: w + 0.16, y0: ycDepan - hDepan / 2 - 0.09, y1: ycDepan + hDepan / 2 + 0.09,
        }));
        wins.forEach(({ c, w }, i) => {
          addJendela(new THREE.Vector3(c, ycDepan, -W / 2), 0, w, hDepan);
          if (i === 0) {
            sun.position.set(c, H * 2.3, -W * 2.2);
            sun.target.position.set(0, 0, 0);
          }
        });
      }
    } else {
      sun.position.set(-L * 1.4, H * 2.4, -W * 1.2);
      sun.target.position.set(0, 0, 0);
    }

    // Arah aliran udara: dari sisi jendela ke seberang.
    const dirMap: Record<string, [number, number]> = {
      kiri: [1, 0], kanan: [-1, 0], depan: [0, 1], belakang: [0, -1],
    };
    R.dir.set(...(dirMap[posisi] ?? [1, 0]), 0).normalize();

    // Empat dinding beton gelap.
    buildDinding({ axis: "x", at: -W / 2, sgn: -1, len: L, openings: openingsPerWall.depan ?? [] });
    buildDinding({ axis: "x", at: W / 2, sgn: 1, len: L, openings: openingsPerWall.belakang ?? [] });
    buildDinding({ axis: "z", at: -L / 2, sgn: -1, len: W, openings: openingsPerWall.kiri ?? [] });
    buildDinding({ axis: "z", at: L / 2, sgn: 1, len: W, openings: openingsPerWall.kanan ?? [] });

    /* ---------- papan tulis (dinding depan) ---------- */
    {
      const bw = Math.min(L * 0.55, 4);
      const bh = 1.15;
      const by = 1.5;
      const zF = -W / 2;
      box(scene, bw + 0.18, bh + 0.18, 0.07, 0, by, zF + 0.045, std(0x6e4720, { roughness: 0.6 }));
      const board = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), std(0xffffff, { map: papanTexture(), roughness: 0.9 }));
      board.position.set(0, by, zF + 0.085);
      board.receiveShadow = true;
      scene.add(board);
      box(scene, bw + 0.1, 0.06, 0.16, 0, by - bh / 2 - 0.13, zF + 0.1, std(0x6e4720)); // tempat kapur
      const lbl = labelSprite("Papan Tulis");
      lbl.position.set(0, by + bh / 2 + 0.55, zF + 0.2);
      scene.add(lbl);
    }

    /* ---------- pintu (dinding belakang, pojok kiri) ---------- */
    if (posisi !== "belakang") {
      const zB = W / 2;
      const dx = -L / 2 + 0.95;
      box(scene, 0.94, 2.02, 0.08, dx, 1.01, zB - 0.05, std(0x7a4f28, { roughness: 0.6 }));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), std(0xfacc15, { metalness: 0.6, roughness: 0.3 }));
      knob.position.set(dx + 0.33, 1.05, zB - 0.11);
      scene.add(knob);
    }

    /* ---------- meja & kursi siswa (menghadap papan tulis) ---------- */
    const topMat = std(0xa86423, { roughness: 0.5 });
    glow("siswa", topMat, 0.6);
    const legMat = std(0x555a63, { metalness: 0.4, roughness: 0.4 });
    const seatMat = std(0x474c55, { roughness: 0.55 });
    glow("siswa", seatMat, 0.45);

    function mejaKursi(x: number, z: number, withChair: boolean) {
      // meja
      box(scene, 0.66, 0.05, 0.48, x, 0.73, z, topMat);
      for (const sx of [-0.29, 0.29])
        for (const sz of [-0.19, 0.19]) box(scene, 0.05, 0.71, 0.05, x + sx, 0.355, z + sz, legMat);
      // kursi di belakang meja (siswa memandang -z ke papan)
      if (!withChair) return;
      const zc = z + 0.34;
      box(scene, 0.44, 0.05, 0.42, x, 0.45, zc, seatMat);
      box(scene, 0.44, 0.5, 0.05, x, 0.72, zc + 0.21, seatMat);
      for (const sx of [-0.18, 0.18])
        for (const sz of [-0.17, 0.17]) box(scene, 0.04, 0.45, 0.04, x + sx, 0.225, zc + sz, legMat);
    }
    props.layout.slice(0, props.jumlahMeja).forEach((p, i) => mejaKursi(p.x, p.z, i < props.jumlahKursi));

    /* ---------- meja guru ---------- */
    {
      const gx = L / 2 - 1.15;
      const gz = -W / 2 + 1.15;
      box(scene, 1.1, 0.06, 0.55, gx, 0.78, gz, std(0x63391a, { roughness: 0.55 }));
      for (const sx of [-0.48, 0.48])
        for (const sz of [-0.21, 0.21]) box(scene, 0.06, 0.75, 0.06, gx + sx, 0.39, gz + sz, legMat);
      box(scene, 0.46, 0.06, 0.44, gx, 0.47, gz - 0.5, seatMat); // kursi guru menghadap kelas
      box(scene, 0.46, 0.5, 0.05, gx, 0.74, gz - 0.71, seatMat);
    }

    /* ---------- kerangka volume ---------- */
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0 });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), edgesMat);
    edges.position.y = H / 2;
    G.volume.add(edges);
    R.edges = edgesMat;

    /* ---------- partikel udara (telemetri termal) ---------- */
    const nP = Math.round(Math.min(1400, Math.max(350, L * W * H * 3.2)));
    const posArr = new Float32Array(nP * 3);
    const colArr = new Float32Array(nP * 3);
    const cold = new THREE.Color(0x60a5fa);
    const hot = new THREE.Color(0xef4444);
    for (let i = 0; i < nP; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * L;
      posArr[i * 3 + 1] = 0.15 + Math.random() * (H - 0.3);
      posArr[i * 3 + 2] = (Math.random() - 0.5) * W;
      const c = cold.clone().lerp(hot, Math.min(1, Math.max(0, props.hotFactor + (Math.random() - 0.5) * 0.16)));
      colArr[i * 3] = c.r;
      colArr[i * 3 + 1] = c.g;
      colArr[i * 3 + 2] = c.b;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    pg.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
    const pointsMat = new THREE.PointsMaterial({
      size: 0.1, vertexColors: true, transparent: true, opacity: 0.68, depthWrite: false,
    });
    const points = new THREE.Points(pg, pointsMat);
    G.udara.add(points);
    R.pointsMat = pointsMat;
    R.speedTarget = Math.min(1.6, 0.55 + props.debit * 0.9);

    /* ---------- kamera, preset & kontrol ---------- */
    const camPresets = (): Record<CamId, { pos: THREE.Vector3; tgt: THREE.Vector3 }> => ({
      orbit: { pos: new THREE.Vector3(L * 0.34, H * 0.68, W * 0.4), tgt: new THREE.Vector3(-L * 0.05, H * 0.4, -W * 0.05) },
      depan: { pos: new THREE.Vector3(0, H * 0.55, W * 0.95), tgt: new THREE.Vector3(0, H * 0.45, -W / 2) },
      atas: { pos: new THREE.Vector3(0, Math.max(L, W) * 0.95, 0.001), tgt: new THREE.Vector3(0, 0, 0) },
      samping: { pos: new THREE.Vector3(L * 0.98, H * 0.5, 0), tgt: new THREE.Vector3(0, H * 0.45, 0) },
      dalam: { pos: new THREE.Vector3(-L * 0.38, 1.6, W * 0.36), tgt: new THREE.Vector3(0, 1.3, -W * 0.4) },
    });

    const flyTo = (id: CamId) => {
      const p = camPresets()[id];
      R.camTween = {
        t: 0, dur: 1.1,
        fromPos: R.camera.position.clone(), toPos: p.pos.clone(),
        fromTgt: R.controls.target.clone(), toTgt: p.tgt.clone(),
      };
    };

    // Tombol kamera di overlay UI memicu event global ini.
    const onCamEvt = (e: Event) => flyTo((e as CustomEvent<{ id: CamId }>).detail.id);
    window.addEventListener("kelas-cam", onCamEvt);
    R.disposeCamEvt = () => window.removeEventListener("kelas-cam", onCamEvt);

    R.camera.position.set(-L * 0.3, 1.7, W * 0.44);
    R.intro.from.copy(R.camera.position);
    R.intro.to.copy(camPresets().orbit.pos);
    R.controls = new OrbitControls(R.camera, R.renderer.domElement);
    R.controls.enableDamping = true;
    R.controls.target.copy(camPresets().orbit.tgt);
    R.controls.minDistance = 1;
    R.controls.maxDistance = Math.hypot(L, W) * 0.72;
    R.controls.enabled = false;

    /* ---------- resize ---------- */
    const fit = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      R.renderer.setSize(mount.clientWidth, mount.clientHeight);
      R.camera.aspect = mount.clientWidth / mount.clientHeight;
      R.camera.updateProjectionMatrix();
    };
    fit();
    R.observer = new ResizeObserver(fit);
    R.observer.observe(mount);

    /* ---------- loop ---------- */
    const tmpDir = new THREE.Vector3();
    const animate = () => {
      R.raf = requestAnimationFrame(animate);
      const dt = Math.min(R.clock.getDelta(), 0.05);
      const t = R.clock.elapsedTime;
      const fk = live.current.fokus;
      const debit = live.current.debit;
      const bukaan = ((live.current.bukaanPct ?? 70) / 100);

      // intro kamera
      if (R.intro.t < 1) {
        R.intro.t = Math.min(1, R.intro.t + dt / 1.5);
        const e = 1 - Math.pow(1 - R.intro.t, 3);
        R.camera.position.lerpVectors(R.intro.from, R.intro.to, e);
        if (R.intro.t >= 1) R.controls.enabled = true;
      }

      // tween kamera menuju preset (mengalahkan orbit manual selama tween)
      if (R.camTween) {
        R.camTween.t += dt / R.camTween.dur;
        const p = Math.min(1, R.camTween.t);
        const e = 1 - Math.pow(1 - p, 3);
        R.camera.position.lerpVectors(R.camTween.fromPos, R.camTween.toPos, e);
        R.controls.target.lerpVectors(R.camTween.fromTgt, R.camTween.toTgt, e);
        if (p >= 1) R.camTween = null;
      }
      R.controls.update();

      // daun jendela mengikuti persen bukaan
      for (const lf of R.leaves) {
        const goal = lf.openRotY * bukaan;
        lf.pivot.rotation.y += (goal - lf.pivot.rotation.y) * Math.min(1, dt * 6);
      }

      // kipas plafon berputar — kecepatan ikut debit udara realtime
      const spinSpeed = 2 + debit * 3;
      for (const bl of R.fans) bl.rotation.y -= spinSpeed * dt;

      // pulsa material sesuai fokus
      for (const [key, entries] of Object.entries(R.glows)) {
        const on = key === fk;
        for (const en of entries!) {
          const goal = on ? en.target * (0.72 + 0.28 * Math.sin(t * 4.6)) : 0;
          en.mat.emissiveIntensity += (goal - en.mat.emissiveIntensity) * Math.min(1, dt * 9);
        }
      }
      if (R.edges) {
        const goal = fk === "volume" ? 0.55 + 0.35 * Math.sin(t * 4.6) * 0.5 + 0.175 : 0;
        R.edges.opacity += (goal - R.edges.opacity) * Math.min(1, dt * 9);
      }
      if (R.sun) {
        const mul = fk === "matahari" ? 1.9 + 0.25 * Math.sin(t * 4.6) : 1;
        // tarik ke intensitas dasar matahari (bukan nilai hardcode lama)
        const base = 2.2;
        R.sun.intensity += (base * mul - R.sun.intensity) * Math.min(1, dt * 7);
      }
      if (R.pointsMat) {
        const boost = fk === "udara" ? 1.8 : fk === "suhu" ? 1.25 : 1;
        const openBoost = 0.4 + bukaan * 1.2; // jendela makin terbuka → aliran makin deras
        R.speedTarget = Math.min(1.6, (0.55 + debit * 0.9) * openBoost);
        R.speedCur += (R.speedTarget * boost - R.speedCur) * Math.min(1, dt * 5);
        R.pointsMat.size = 0.1 * (fk === "udara" || fk === "suhu" ? 1.35 + 0.15 * Math.sin(t * 4.6) : 1);
        R.pointsMat.opacity = fk === "suhu" ? 0.85 : 0.68;
      }

      // gerak partikel
      tmpDir.copy(R.dir);
      const arr = pg.attributes.position.array as Float32Array;
      const sp = R.speedCur * dt;
      for (let i = 0; i < nP; i++) {
        const j = i * 3;
        const sway = Math.sin(t * 0.9 + i * 1.7) * 0.14;
        arr[j] += tmpDir.x * sp + sway * dt * (tmpDir.x === 0 ? 1 : 0);
        arr[j + 1] += (Math.sin(t * 1.3 + i) * 0.05 + 0.012) * dt + sway * 0.0002;
        arr[j + 2] += tmpDir.z * sp + sway * dt * (tmpDir.z === 0 ? 1 : 0);
        // bungkus torus
        if (arr[j] > L / 2) arr[j] -= L;
        else if (arr[j] < -L / 2) arr[j] += L;
        if (arr[j + 2] > W / 2) arr[j + 2] -= W;
        else if (arr[j + 2] < -W / 2) arr[j + 2] += W;
        if (arr[j + 1] > H) arr[j + 1] = 0.1;
      }
      pg.attributes.position.needsUpdate = true;

      R.renderer.render(scene, R.camera);
    };
    animate();

    // Hook debug untuk pengujian headless.
    (window as unknown as Record<string, unknown>).__kelasScene = () => ({
      jendela: G.jendela.children.length,
      dinding: G.dinding.children.length,
      meja: scene.children.length,
      kipas: R.fans.length,
      daunJendela: R.leaves.map((l) => Math.round((l.pivot.rotation.y * 180) / Math.PI)),
      kamera: R.camera.position.toArray().map((v) => Math.round(v * 100) / 100),
    });

    /* ---------- bersih-bersih ---------- */
    return () => {
      cancelAnimationFrame(R.raf);
      R.observer?.disconnect();
      R.disposeCamEvt();
      R.controls.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh || (o as THREE.Points).isPoints || (o as THREE.LineSegments).isLineSegments) {
          mesh.geometry?.dispose();
          const m = mesh.material as THREE.Material | THREE.Material[];
          const disposeOne = (mm: THREE.Material) => {
            const anyMat = mm as unknown as { map?: THREE.Texture };
            anyMat.map?.dispose();
            mm.dispose();
          };
          if (Array.isArray(m)) m.forEach(disposeOne);
          else if (m) disposeOne(m);
        }
      });
      R.renderer.dispose();
      mount.removeChild(R.renderer.domElement);
      refsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.panjang,
    props.lebar,
    props.tinggi,
    props.layout,
    props.jumlahMeja,
    props.jumlahKursi,
    props.jumlahJendela,
    props.posisiJendela,
  ]);

  return <div ref={mountRef} className="absolute inset-0" />;
}
