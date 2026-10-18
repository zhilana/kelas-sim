"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type MenuId = "simulasi" | "kalkulator" | "bahan";

type Props = {
  aktif: MenuId | null;
  onHover: (id: MenuId | null) => void;
  onPilih: (id: MenuId) => void;
};

type Stasiun = { id: MenuId; grup: THREE.Group; dasarY: number; dasarRot: number; skala: number };

const std = (warna: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color: warna, roughness: 0.72, metalness: 0.03, ...o });

/* ------------------------- objek 1: diorama kelas ------------------------ */
function dioramaKelas() {
  const g = new THREE.Group();
  const lantai = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 1.35), std(0xe4ded0, { roughness: 0.9 }));
  lantai.position.y = 0.035;
  lantai.receiveShadow = true;
  g.add(lantai);

  const dinding = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.95, 0.06), std(0xf2efe7, { roughness: 0.95 }));
  dinding.position.set(0, 0.5, -0.66);
  dinding.castShadow = dinding.receiveShadow = true;
  g.add(dinding);

  const papan = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.4, 0.02), std(0x2f5d45, { roughness: 0.55 }));
  papan.position.set(0, 0.62, -0.62);
  g.add(papan);

  const kayu = std(0xb0763c, { roughness: 0.65 });
  const buatMeja = (x: number, z: number, s: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.34 * s, 0.045, 0.24 * s), kayu);
    m.position.set(x, 0.34, z);
    m.castShadow = true;
    g.add(m);
    const kaki = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.2), std(0x8a8f96, { metalness: 0.4, roughness: 0.5 }));
    kaki.position.set(x, 0.17, z);
    g.add(kaki);
  };
  const buatSiswa = (x: number, z: number, warna: number) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), std(warna, { roughness: 0.6 }));
    b.position.set(x, 0.46, z);
    b.castShadow = true;
    g.add(b);
  };

  const warnaBaju = [0x4f6bed, 0x22b8a6, 0xd4657f, 0xe2a33c];
  let i = 0;
  for (const z of [0.18, 0.48])
    for (const x of [-0.52, 0, 0.52]) {
      buatMeja(x, z, 1);
      buatSiswa(x, z + 0.19, warnaBaju[i++ % warnaBaju.length]);
    }

  // meja guru di depan, menghadap kelas
  const mejaGuru = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.3), std(0x63391a, { roughness: 0.6 }));
  mejaGuru.position.set(0, 0.42, -0.42);
  mejaGuru.castShadow = true;
  g.add(mejaGuru);
  const guru = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), std(0x1e3a8a, { roughness: 0.6 }));
  guru.position.set(0, 0.52, -0.56);
  guru.castShadow = true;
  g.add(guru);

  return g;
}

/* -------------------------- objek 2: kalkulator -------------------------- */
function kalkulator() {
  const g = new THREE.Group();
  const badan = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.5, 0.16), std(0xf3f1ea, { roughness: 0.55 }));
  badan.castShadow = badan.receiveShadow = true;
  g.add(badan);

  const layar = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.03), std(0x22303a, { roughness: 0.3 }));
  layar.position.set(0, 0.48, 0.09);
  g.add(layar);

  const tombolTerang = std(0xe6e2d6, { roughness: 0.5 });
  const tombolAksen = std(0x2563eb, { roughness: 0.45 });
  const tombolGelap = std(0x8b8f88, { roughness: 0.5 });
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const aksen = c === 3;
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.17, 0.05), aksen ? tombolAksen : r === 0 ? tombolGelap : tombolTerang);
      t.position.set(-0.36 + c * 0.24, 0.18 - r * 0.235, 0.09);
      t.castShadow = true;
      g.add(t);
    }

  g.rotation.x = -0.22;
  g.position.y = 0.85;
  return g;
}

/* ------------------------- objek 3: tumpukan bata ------------------------ */
function tumpukanBata() {
  const g = new THREE.Group();
  const merah = [0xb8563a, 0xc25f41, 0xa94a30];
  const bata = (x: number, y: number, z: number, rot: number, i: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.3), std(merah[i % 3], { roughness: 0.95 }));
    m.position.set(x, y, z);
    m.rotation.y = rot;
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  };
  // lapisan bawah: 3 bata memanjang
  bata(-0.32, 0.1, 0, 0, 0);
  bata(0.32, 0.1, 0, 0, 1);
  bata(0, 0.1, 0.32, Math.PI / 2, 2);
  // lapisan tengah: 2 bata menyilang
  bata(-0.16, 0.3, -0.05, Math.PI / 2, 1);
  bata(0.2, 0.3, 0.12, Math.PI / 2, 0);
  // lapisan atas: 1 bata
  bata(0, 0.5, 0, 0.15, 2);
  return g;
}

export default function MenuScene({ aktif, onHover, onPilih }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef({ aktif, onHover, onPilih });
  api.current = { aktif, onHover, onPilih };

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    camera.position.set(0, 2.3, 8.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);

    // IBL ringan supaya material logam/kaca di menu tidak tampil hitam.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8f8a7c, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 22;
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-5, 3, 2);
    scene.add(fill);

    const lantai = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.ShadowMaterial({ opacity: 0.13 }));
    lantai.rotation.x = -Math.PI / 2;
    lantai.receiveShadow = true;
    scene.add(lantai);

    const stasiun: Stasiun[] = [
      { id: "simulasi", grup: dioramaKelas(), dasarY: 0.32, dasarRot: -0.22, skala: 0.86 },
      { id: "kalkulator", grup: kalkulator(), dasarY: 0.1, dasarRot: 0, skala: 1.02 },
      { id: "bahan", grup: tumpukanBata(), dasarY: 0.26, dasarRot: 0.3, skala: 1.1 },
    ];
    const posisiX = [-2.55, 0, 2.55];
    stasiun.forEach((s, i) => {
      s.grup.position.set(posisiX[i], s.dasarY, i === 1 ? -0.35 : 0.15);
      s.grup.scale.setScalar(s.skala);
      s.grup.userData.id = s.id;
      scene.add(s.grup);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.72, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minPolarAngle = 1.05;
    controls.maxPolarAngle = 1.42;
    controls.minAzimuthAngle = -0.55;
    controls.maxAzimuthAngle = 0.55;
    controls.update();

    // --- interaksi ---
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hover: MenuId | null = null;
    let turun: { x: number; y: number } | null = null;

    const cariId = (ev: PointerEvent): MenuId | null => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(stasiun.map((s) => s.grup), true);
      if (!hits.length) return null;
      let o: THREE.Object3D | null = hits[0].object;
      while (o && !o.userData.id) o = o.parent;
      return (o?.userData.id as MenuId) ?? null;
    };

    const onMove = (ev: PointerEvent) => {
      const id = cariId(ev);
      if (id !== hover) {
        hover = id;
        api.current.onHover(id);
      }
      renderer.domElement.style.cursor = id ? "pointer" : "grab";
    };
    const onDown = (ev: PointerEvent) => {
      turun = { x: ev.clientX, y: ev.clientY };
    };
    const onUp = (ev: PointerEvent) => {
      if (!turun) return;
      const jauh = Math.hypot(ev.clientX - turun.x, ev.clientY - turun.y);
      turun = null;
      if (jauh > 6) return; // itu drag, bukan klik
      const id = cariId(ev);
      if (id) api.current.onPilih(id);
    };
    const onLeave = () => {
      hover = null;
      api.current.onHover(null);
    };

    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointerleave", onLeave);

    const fit = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Ketiga objek membentang ±3,65 m. Panel ini bisa tinggi & sempit
      // (fov horizontal kecil), jadi jarak kamera dihitung dari fov
      // horizontal — bukan angka tetap — supaya objek paling kanan tidak
      // terpotong keluar layar.
      const setengahLebar = 3.65;
      const hfov = 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
      const jarak = Math.max(6, setengahLebar / Math.tan(hfov / 2));
      camera.position.set(0, jarak * 0.3, jarak);
      camera.lookAt(0, 0.72, 0);
      controls.update();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);

    const clock = new THREE.Clock();
    const skalaTarget = new THREE.Vector3();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const aktifSekarang = api.current.aktif;

      stasiun.forEach((s, i) => {
        const nyala = aktifSekarang === s.id;
        const sk = (nyala ? 1.13 : 1) * s.skala;
        skalaTarget.set(sk, sk, sk);
        const targetY = s.dasarY + (nyala ? 0.16 : 0) + Math.sin(t * 0.9 + i * 1.7) * 0.045;
        const k = Math.min(1, dt * 7);
        s.grup.scale.lerp(skalaTarget, k);
        s.grup.position.y += (targetY - s.grup.position.y) * k;
        // goyang pelan kiri-kanan, bukan berputar penuh — sisi depannya selalu
        // menghadap pengunjung, dan makin hidup saat item-nya disorot.
        const amp = nyala ? 0.55 : 0.32;
        const kec = nyala ? 1.15 : 0.55;
        s.grup.rotation.y = s.dasarRot + Math.sin(t * kec + i * 2.1) * amp;
      });

      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      controls.dispose();
      renderer.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} className="absolute inset-0" aria-hidden />;
}
