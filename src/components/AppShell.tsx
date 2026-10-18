"use client";

import { useCallback, useState } from "react";
import MainMenu from "./MainMenu";
import Kalkulator from "./Kalkulator";
import BahanBangunan from "./BahanBangunan";
import KelasSimulator from "./KelasSimulator";
import type { MenuId } from "./MenuScene";

type Layar = "menu" | MenuId;

export default function AppShell() {
  const [layar, setLayar] = useState<Layar>("menu");

  const pindah = useCallback((tujuan: Layar) => {
    const ganti = () => {
      setLayar(tujuan);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(ganti);
      return;
    }
    ganti();
  }, []);

  const keMenu = useCallback(() => pindah("menu"), [pindah]);

  if (layar === "menu") return <MainMenu onPilih={pindah} />;
  if (layar === "kalkulator") return <Kalkulator onHome={keMenu} />;
  if (layar === "bahan") return <BahanBangunan onHome={keMenu} />;
  return <KelasSimulator onHome={keMenu} />;
}
