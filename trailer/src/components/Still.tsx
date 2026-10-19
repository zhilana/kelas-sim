import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { Caption } from "./BrowserFrame";

/**
 * Still dengan gerakan kamera pelan (Ken Burns). Semua ukuran dalam persen
 * supaya tetap pas di komposisi 1920×1080.
 */
export const KenBurns: React.FC<{
  src: string;
  dari?: number;
  ke?: number;
  geserX?: number;
  geserY?: number;
  durasi: number;
}> = ({ src, dari = 1.04, ke = 1.12, geserX = 0, geserY = 0, durasi }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, durasi], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Img
      src={src}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        scale: interpolate(p, [0, 1], [dari, ke]),
        translate: `${geserX * p}px ${geserY * p}px`,
      }}
    />
  );
};

/** Beberapa still yang saling silang-tindih di dalam satu scene. */
export const StillStack: React.FC<{
  items: { src: string; from: number; to: number; dari?: number; ke?: number; geserX?: number; geserY?: number }[];
  durasi: number;
}> = ({ items, durasi }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {items.map((it, i) => {
        const op = interpolate(
          frame,
          [it.from - 12, it.from + 10, it.to - 10, it.to + 12],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        if (frame < it.from - 14 || frame > it.to + 14) return null;
        return (
          <AbsoluteFill key={i} style={{ opacity: op }}>
            <KenBurns
              src={it.src}
              dari={it.dari ?? 1.03}
              ke={it.ke ?? 1.1}
              geserX={it.geserX ?? 0}
              geserY={it.geserY ?? 0}
              durasi={durasi}
            />
          </AbsoluteFill>
        );
      })}
    </>
  );
};

/** Keterangan yang berganti mengikuti waktu. */
export const CaptionTrack: React.FC<{
  items: { from: number; to: number; no?: string; judul: string; ket?: string }[];
}> = ({ items }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {items.map((it, i) => {
        const op = interpolate(frame, [it.from, it.from + 8, it.to - 8, it.to], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (op <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 110,
              bottom: 96,
              opacity: op,
              translate: `0 ${interpolate(op, [0, 1], [18, 0])}px`,
            }}
          >
            <Caption no={it.no} judul={it.judul} ket={it.ket} />
          </div>
        );
      })}
    </>
  );
};
