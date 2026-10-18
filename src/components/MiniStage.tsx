"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buangModel, buatModelBahan } from "@/lib/bahan3d";

type Props = {
  /** id bahan yang ditampilkan */
  id: string;
  className?: string;
};

type Inti = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  root: THREE.Group;
  raf: number;
  observer: ResizeObserver;
};

/**
 * Panggung kecil untuk satu model bahan: satu renderer, modelnya ditukar
 * saat id berubah. Auto-rotate pelan + bisa diputar manual (drag).
 */
export default function MiniStage({ id, className }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const inti = useRef<Inti | null>(null);
  const model = useRef<THREE.Group | null>(null);

  // --- setup sekali ---
  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
    camera.position.set(2.0, 1.7, 2.9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    el.appendChild(renderer.domElement);

    // Lingkungan IBL: tanpa ini material logam (baja, seng) tampil hitam pekat
    // karena tidak ada yang bisa dipantulkan.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9484, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(2.6, 4.2, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    const d = 3;
    Object.assign(key.shadow.camera, { left: -d, right: d, top: d, bottom: -d });
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    const lantai = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.ShadowMaterial({ opacity: 0.16 }));
    lantai.rotation.x = -Math.PI / 2;
    lantai.receiveShadow = true;
    scene.add(lantai);

    const root = new THREE.Group();
    scene.add(root);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.55, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minPolarAngle = 0.9;
    controls.maxPolarAngle = 1.45;
    controls.minAzimuthAngle = -0.7;
    controls.maxAzimuthAngle = 0.7;
    controls.update();

    const fit = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (model.current) model.current.rotation.y += dt * 0.45;
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    inti.current = { scene, camera, renderer, controls, root, raf, observer };

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      if (model.current) {
        root.remove(model.current);
        buangModel(model.current);
      }
      renderer.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.domElement.remove();
      inti.current = null;
    };
  }, []);

  // --- tukar model saat bahan berubah ---
  useEffect(() => {
    const i = inti.current;
    if (!i) return;
    if (model.current) {
      i.root.remove(model.current);
      buangModel(model.current);
    }
    const g = buatModelBahan(id);
    i.root.add(g);
    model.current = g;
  }, [id]);

  return <div ref={mount} className={className} />;
}
