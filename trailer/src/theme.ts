export const C = {
  canvas: "#fafaf8",
  panel: "#ffffff",
  panel2: "#f3f3ef",
  line: "#e8e8e4",
  lineStrong: "#c9c9c4",
  ink: "#1f2320",
  muted: "#6c6c68",
  accent: "#2563eb",
  accentSoft: "#eff6ff",
  good: "#15803d",
  bad: "#b91c1c",
} as const;

export const FONT = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif';

/** Latar hangat + kisi tipis, dipakai di semua scene. */
export const gridBg = (warna = C.canvas) => ({
  backgroundColor: warna,
  backgroundImage: `linear-gradient(to right, rgba(31,35,32,0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(31,35,32,0.045) 1px, transparent 1px)`,
  backgroundSize: "64px 64px",
});
