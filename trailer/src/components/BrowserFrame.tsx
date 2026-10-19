import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { C, FONT } from "../theme";

/**
 * Jendela browser tiruan untuk menampilkan rekaman/still aplikasi.
 * Ukuran mengikuti aspect 16:10 (sama dengan screenshot 3200×2000).
 */
export const BrowserFrame: React.FC<{
  children: React.ReactNode;
  url?: string;
  style?: React.CSSProperties;
  width: number;
}> = ({ children, url = "localhost:3120", style, width }) => {
  return (
    <div
      style={{
        width,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 50px 90px -40px rgba(20,24,20,0.45), 0 8px 24px -12px rgba(20,24,20,0.18)",
        ...style,
      }}
    >
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 22px",
          backgroundColor: "#fbfbf9",
          borderBottom: `1px solid ${C.line}`,
          fontFamily: FONT,
        }}
      >
        {["#f0b0a8", "#f2d6a2", "#b9dcb4"].map((w) => (
          <div key={w} style={{ width: 13, height: 13, borderRadius: 99, backgroundColor: w }} />
        ))}
        <div
          style={{
            marginLeft: 16,
            height: 28,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            borderRadius: 99,
            backgroundColor: "#f1f1ec",
            color: C.muted,
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};

/** Keterangan di bawah panggung: nomor + judul + subjudul. */
export const Caption: React.FC<{
  no?: string;
  judul: string;
  ket?: string;
  style?: React.CSSProperties;
}> = ({ no, judul, ket, style }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        fontFamily: FONT,
        color: C.ink,
        ...style,
      }}
    >
      {no ? (
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 2,
            color: C.accent,
            padding: "8px 16px",
            borderRadius: 10,
            backgroundColor: C.accentSoft,
            border: `1px solid rgba(37,99,235,0.25)`,
          }}
        >
          {no}
        </span>
      ) : null}
      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 54, fontWeight: 700, letterSpacing: -1.2 }}>{judul}</span>
        {ket ? <span style={{ fontSize: 26, color: C.muted, fontWeight: 500 }}>{ket}</span> : null}
      </span>
    </div>
  );
};

/** Pita gradasi di bawah frame supaya teks keterangan tetap terbaca. */
export const BottomScrim: React.FC<{ tinggi?: number }> = ({ tinggi = 260 }) => (
  <AbsoluteFill
    style={{
      top: "auto",
      height: tinggi,
      background: `linear-gradient(to bottom, rgba(250,250,248,0), rgba(250,250,248,0.86) 55%, ${C.canvas} 100%)`,
      pointerEvents: "none",
    }}
  />
);

export const masih = (nama: string) => staticFile(`still/${nama}.png`);
