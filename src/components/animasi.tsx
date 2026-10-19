"use client";

import gsap from "gsap";
import { createElement, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";

/**
 * Utilitas animasi berbasis GSAP.
 *
 *  - useReveal: hook sekali-panggil per layar. Mencari elemen [data-kata]
 *    (kata yang berpecah satu per satu) dan [data-reveal] (kartu yang
 *    muncul berurutan), lalu menganimasikannya. Dipasang lewat
 *    useLayoutEffect supaya kondisi awal "tersembunyi" terpasang sebelum
 *    paint pertama — tidak ada kedipan.
 *  - kata(): pembungkus satu kata/fragmen heading; setiap pemanggilan
 *    menjadi satu langkah dalam stagger useReveal.
 */

export function useReveal<T extends HTMLElement>(): RefObject<T | null> {
  const scope = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const kata = el.querySelectorAll("[data-kata]");
    const kartu = el.querySelectorAll("[data-reveal]");
    if (!kata.length && !kartu.length) return;

    // Pasang kondisi awal dulu (set), lalu animasikan ke arah normal (to).
    // Pola set→to bersih di bawah React StrictMode: from()/context.revert()
    // bisa menempelkan nilai awal from secara permanen.
    const pills: gsap.core.Tween[] = [];

    if (kata.length) {
      gsap.set(kata, { yPercent: 70, opacity: 0, filter: "blur(10px)" });
      pills.push(
        gsap.to(kata, {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.05,
          delay: 0.05,
        }),
      );
    }
    if (kartu.length) {
      gsap.set(kartu, { y: 24, opacity: 0 });
      pills.push(
        gsap.to(kartu, {
          y: 0,
          opacity: 1,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.08,
          delay: kata.length ? 0.45 : 0.05,
        }),
      );
    }
    return () => {
      pills.forEach((t) => t.kill());
      gsap.set([...kata, ...kartu], { clearProps: "all" });
    };
  }, []);

  return scope;
}

/** Satu kata/fragmen heading yang di-reveal berurutan. */
export function kata({
  children,
  accent = false,
  className,
}: {
  children: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return createElement(
    "span",
    {
      "data-kata": "",
      className: `inline-block ${accent ? "text-accent" : ""} ${className ?? ""}`,
    },
    children,
  );
}
