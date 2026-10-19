"use client";

import { useEffect, useState } from "react";

const KUNCI = "kelas-theme";

function bacaTema(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/** Tombol pojok kanan-atas: ganti light/dark, menulis attribute + localStorage. */
export default function ThemeToggle() {
  const [tema, setTema] = useState<"light" | "dark">("light");
  const [pasang, setPasang] = useState(false);

  useEffect(() => {
    setTema(bacaTema());
    setPasang(true);
  }, []);

  const ganti = () => {
    const ke = tema === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", ke);
    try {
      localStorage.setItem(KUNCI, ke);
    } catch {
      /* mode privat: abaikan saja */
    }
    setTema(ke);
  };

  return (
    <button
      type="button"
      onClick={ganti}
      aria-label={tema === "dark" ? "Mode terang" : "Mode gelap"}
      className="fixed right-4 top-4 z-40 grid h-9 w-9 place-items-center rounded-full border border-line bg-panel/80 text-muted shadow-card backdrop-blur transition-all hover:border-line-strong hover:text-ink active:scale-90"
      style={{ opacity: pasang ? 1 : 0 }}
    >
      {pasang && (tema === "dark" ? <IkonMatahari /> : <IkonBulan />)}
    </button>
  );
}

function IkonMatahari() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IkonBulan() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
