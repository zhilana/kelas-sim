"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { MenuId } from "@/components/MenuScene";

export type Layar = "menu" | MenuId;

/** Peta layar → URL. Satu sumber ikhtisar jalur aplikasi. */
export const RUTE: Record<Layar, string> = {
  menu: "/menu",
  simulasi: "/simulasi",
  kalkulator: "/kalkulator",
  bahan: "/bahan",
};

/** Pindah layar lewat Next.js router (URL beneran: /menu, /simulasi, dst). */
export function usePindah() {
  const router = useRouter();
  return useCallback(
    (tujuan: Layar) => {
      router.push(RUTE[tujuan]);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    },
    [router],
  );
}
