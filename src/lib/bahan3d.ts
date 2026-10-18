// Model 3D satu unit bahan bangunan. Semua fungsi di sini hanya boleh
// dipanggil di browser (butuh canvas untuk tekstur) — dipakai oleh
// komponen galeri bahan, bukan oleh API route.
import * as THREE from "three";

type Opsi = Partial<THREE.MeshStandardMaterialParameters>;

const std = (warna: number, o: Opsi = {}) =>
  new THREE.MeshStandardMaterial({ color: warna, roughness: 0.8, metalness: 0.02, ...o });

/** Tekstur prosedural dari canvas 2D (tanpa file gambar eksternal). */
function tekstur(gambar: (c: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 256) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d");
  if (c) gambar(c, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Bintik acak — dipakai untuk bata, beton, hebel. */
function bintik(c: CanvasRenderingContext2D, w: number, h: number, n: number, alpha: number, terang = true) {
  for (let i = 0; i < n; i++) {
    const r = Math.random() * 2.4 + 0.4;
    c.fillStyle = terang
      ? `rgba(255,255,255,${Math.random() * alpha})`
      : `rgba(0,0,0,${Math.random() * alpha})`;
    c.beginPath();
    c.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
    c.fill();
  }
}

function alas(lebar: number, dalam: number, warna = 0xd8d3c8) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(lebar, 0.06, dalam), std(warna, { roughness: 0.95 }));
  m.position.y = 0.03;
  m.receiveShadow = true;
  return m;
}

/* ------------------------------ bata merah ------------------------------ */
function bataMerah() {
  const g = new THREE.Group();
  g.add(alas(1.3, 0.68, 0xd6cfc1));
  const map = tekstur((c, w, h) => {
    c.fillStyle = "#a8452c";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      c.fillStyle = `rgba(120,45,25,${Math.random() * 0.35})`;
      c.beginPath();
      c.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 22, 4 + Math.random() * 10, 0, 0, Math.PI * 2);
      c.fill();
    }
    bintik(c, w, h, 320, 0.16, true);
    bintik(c, w, h, 220, 0.14, false);
  });
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.55), std(0xffffff, { map, roughness: 0.95 }));
  b.position.y = 0.27;
  b.castShadow = b.receiveShadow = true;
  g.add(b);
  return g;
}

/* -------------------------------- batako -------------------------------- */
function batako() {
  const g = new THREE.Group();
  g.add(alas(1.3, 0.62, 0xcfcac0));
  const s = new THREE.Shape();
  s.moveTo(-0.575, 0);
  s.lineTo(0.575, 0);
  s.lineTo(0.575, 0.5);
  s.lineTo(-0.575, 0.5);
  s.closePath();
  for (const x of [-0.3, 0.3]) {
    const h = new THREE.Path();
    h.moveTo(x - 0.13, 0.11);
    h.lineTo(x + 0.13, 0.11);
    h.lineTo(x + 0.13, 0.39);
    h.lineTo(x - 0.13, 0.39);
    h.closePath();
    s.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 2 });
  geo.translate(0, 0, -0.25);
  const map = tekstur((c, w, h) => {
    c.fillStyle = "#9b9b93";
    c.fillRect(0, 0, w, h);
    bintik(c, w, h, 400, 0.2, true);
    bintik(c, w, h, 260, 0.16, false);
  });
  const m = new THREE.Mesh(geo, std(0xffffff, { map, roughness: 0.96 }));
  m.position.y = 0.06;
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return g;
}

/* ----------------------------- bata ringan ------------------------------ */
function hebel() {
  const g = new THREE.Group();
  g.add(alas(1.3, 0.66, 0xd2cec4));
  const map = tekstur((c, w, h) => {
    c.fillStyle = "#e9e6dc";
    c.fillRect(0, 0, w, h);
    bintik(c, w, h, 700, 0.35, false);
    bintik(c, w, h, 200, 0.5, true);
  });
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.55), std(0xffffff, { map, roughness: 0.98 }));
  b.position.y = 0.27;
  b.castShadow = b.receiveShadow = true;
  g.add(b);
  // alur lidah di sisi atas — ciri khas bata ringan
  const alur = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.06), std(0xc9c5ba, { roughness: 1 }));
  alur.position.set(0, 0.482, 0);
  g.add(alur);
  return g;
}

/* -------------------------------- beton --------------------------------- */
function beton() {
  const g = new THREE.Group();
  g.add(alas(1.0, 0.8, 0xc6c2b8));
  const map = tekstur((c, w, h) => {
    c.fillStyle = "#a9a9a2";
    c.fillRect(0, 0, w, h);
    bintik(c, w, h, 500, 0.28, true);
    bintik(c, w, h, 400, 0.22, false);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(90,90,86,${Math.random() * 0.4})`;
      c.beginPath();
      c.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 0, Math.PI * 2);
      c.fill();
    }
  });
  const kolom = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.62), std(0xffffff, { map, roughness: 0.92 }));
  kolom.position.y = 0.585;
  kolom.castShadow = kolom.receiveShadow = true;
  g.add(kolom);
  // besi tulangan menonjol ke atas
  const besi = std(0x8a8f96, { metalness: 0.85, roughness: 0.35 });
  for (const sx of [-0.2, 0.2])
    for (const sz of [-0.2, 0.2]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 10), besi);
      r.position.set(sx, 1.3, sz);
      r.castShadow = true;
      g.add(r);
    }
  const sengkang = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.014, 8, 4), besi);
  sengkang.rotation.x = Math.PI / 2;
  sengkang.rotation.z = Math.PI / 4;
  sengkang.position.y = 1.32;
  g.add(sengkang);
  return g;
}

/* --------------------------------- kayu --------------------------------- */
function kayu() {
  const g = new THREE.Group();
  const map = tekstur((c, w, h) => {
    c.fillStyle = "#a9743f";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      c.strokeStyle = `rgba(${90 + Math.random() * 40},${55 + Math.random() * 30},${20 + Math.random() * 20},${0.15 + Math.random() * 0.3})`;
      c.lineWidth = 0.6 + Math.random() * 1.8;
      c.beginPath();
      const y = Math.random() * h;
      c.moveTo(0, y);
      c.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 14, w * 0.7, y + (Math.random() - 0.5) * 14, w, y);
      c.stroke();
    }
  });
  const kayuMat = std(0xffffff, { map, roughness: 0.72 });
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.62), kayuMat);
    p.position.set(0, 0.09 + i * 0.155, (i % 2 === 0 ? 1 : -1) * 0.02);
    p.rotation.y = (i - 1) * 0.05;
    p.castShadow = p.receiveShadow = true;
    g.add(p);
  }
  return g;
}

/* --------------------------------- kaca --------------------------------- */
function kaca() {
  const g = new THREE.Group();
  const rangka = std(0x6f757c, { metalness: 0.6, roughness: 0.45 });
  const w = 1.0;
  const h = 1.0;
  const t = 0.05;
  for (const [bw, bh, x, y] of [
    [w + t * 2, t, 0, h / 2 + t / 2],
    [w + t * 2, t, 0, -h / 2 - t / 2],
    [t, h, -w / 2 - t / 2, 0],
    [t, h, w / 2 + t / 2, 0],
  ] as [number, number, number, number][]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, t * 1.6), rangka);
    m.position.set(x, y + 0.62, 0);
    m.castShadow = true;
    g.add(m);
  }
  const pane = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.02),
    new THREE.MeshPhysicalMaterial({
      color: 0xbfdcea,
      transparent: true,
      opacity: 0.34,
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  pane.position.y = 0.62;
  g.add(pane);
  return g;
}

/* -------------------------------- gypsum -------------------------------- */
function gypsum() {
  const g = new THREE.Group();
  const map = tekstur((c, w, h) => {
    c.fillStyle = "#f1eee5";
    c.fillRect(0, 0, w, h);
    bintik(c, w, h, 260, 0.12, false);
    c.strokeStyle = "rgba(200,195,182,0.55)";
    c.lineWidth = 2;
    c.strokeRect(4, 4, w - 8, h - 8);
  });
  const papan = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 0.045), std(0xffffff, { map, roughness: 0.9 }));
  papan.position.y = 0.6;
  papan.castShadow = papan.receiveShadow = true;
  g.add(papan);
  // potongan kecil bersandar di depannya
  const kecil = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.045), std(0xffffff, { map, roughness: 0.9 }));
  kecil.position.set(0.42, 0.22, 0.24);
  kecil.rotation.x = -0.18;
  kecil.rotation.z = -0.06;
  kecil.castShadow = true;
  g.add(kecil);
  return g;
}

/* ------------------------------ baja ringan ----------------------------- */
function bajaRingan() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  // profil C: 0,5 m × 0,4 m, tebal 0,06 m
  s.moveTo(0, 0);
  s.lineTo(0.4, 0);
  s.lineTo(0.4, 0.06);
  s.lineTo(0.06, 0.06);
  s.lineTo(0.06, 0.34);
  s.lineTo(0.4, 0.34);
  s.lineTo(0.4, 0.4);
  s.lineTo(0, 0.4);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.25, bevelEnabled: false, curveSegments: 2 });
  geo.translate(-0.2, 0, -0.625);
  const m = new THREE.Mesh(geo, std(0xc3ccd3, { metalness: 0.82, roughness: 0.34 }));
  m.rotation.y = Math.PI / 2;
  m.position.y = 0.08;
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return g;
}

/* -------------------------------- keramik ------------------------------- */
function keramik() {
  const g = new THREE.Group();
  const map = tekstur((c, w, h) => {
    c.fillStyle = "#cfc7b8";
    c.fillRect(0, 0, w, h);
    const n = 4;
    const s = w / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const dasar = 205 + Math.random() * 22;
        c.fillStyle = `rgb(${dasar},${dasar - 6},${dasar - 18})`;
        c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
        // urat marmer halus
        c.strokeStyle = `rgba(150,145,130,${0.12 + Math.random() * 0.2})`;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(i * s + Math.random() * s, j * s);
        c.bezierCurveTo(i * s + s * 0.4, j * s + s * 0.4, i * s + s * 0.6, j * s + s * 0.6, i * s + Math.random() * s, j * s + s);
        c.stroke();
      }
  });
  const k = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 1.2), std(0xffffff, { map, roughness: 0.28, metalness: 0.04 }));
  k.position.y = 0.035;
  k.receiveShadow = true;
  k.castShadow = true;
  g.add(k);
  return g;
}

/* --------------------------------- seng --------------------------------- */
function seng() {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1.25, 0.85, 60, 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, Math.sin((x / 1.25) * Math.PI * 2 * 5) * 0.045);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(
    geo,
    std(0xa8b4bd, { metalness: 0.78, roughness: 0.42, side: THREE.DoubleSide }),
  );
  m.rotation.x = -Math.PI / 2 + 0.35;
  m.position.y = 0.36;
  m.castShadow = m.receiveShadow = true;
  g.add(m);
  return g;
}

/* -------------------------------- triplek ------------------------------- */
function triplek() {
  const g = new THREE.Group();
  const map = tekstur((c, w, h) => {
    c.fillStyle = "#c08f5a";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      c.strokeStyle = `rgba(${140 + Math.random() * 40},${95 + Math.random() * 30},${45 + Math.random() * 25},${0.12 + Math.random() * 0.25})`;
      c.lineWidth = 0.7 + Math.random() * 1.6;
      c.beginPath();
      const y = Math.random() * h;
      c.moveTo(0, y);
      c.bezierCurveTo(w * 0.35, y + (Math.random() - 0.5) * 18, w * 0.65, y + (Math.random() - 0.5) * 18, w, y);
      c.stroke();
    }
  });
  const papan = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 0.05), std(0xffffff, { map, roughness: 0.68 }));
  papan.position.y = 0.6;
  papan.castShadow = papan.receiveShadow = true;
  g.add(papan);
  // lapisan venir di tepi — ciri khas triplek
  for (let i = 0; i < 3; i++) {
    const lapis = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.014, 0.052),
      std(i % 2 === 0 ? 0x8a6134 : 0xd0a06a, { roughness: 0.8 }),
    );
    lapis.position.set(0, 0.6 + (i - 1) * 0.016, 0.002);
    g.add(lapis);
  }
  return g;
}

const PEMBUAT: Record<string, () => THREE.Group> = {
  bata_merah: bataMerah,
  batako,
  hebel,
  beton,
  kayu,
  kaca,
  gypsum,
  baja_ringan: bajaRingan,
  keramik,
  seng,
  triplek,
};

/** Bangun model 3D satu unit bahan; jatuh ke bata merah kalau id tak dikenal. */
export function buatModelBahan(id: string): THREE.Group {
  const f = PEMBUAT[id] ?? bataMerah;
  const g = f();
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) m.castShadow = m.castShadow ?? true;
  });
  return g;
}

/** Lepas semua geometry/material/tekstur sebuah grup (dipanggil saat ganti bahan). */
export function buangModel(g: THREE.Object3D) {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry?.dispose();
    const mat = m.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
    const list = Array.isArray(mat) ? mat : [mat];
    for (const mm of list) {
      (mm.map as THREE.Texture | null)?.dispose();
      mm.dispose();
    }
  });
}
