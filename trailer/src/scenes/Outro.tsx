import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, gridBg } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const masuk = spring({ frame, fps, config: { damping: 200, mass: 0.7 } });
  const teks = spring({ frame: frame - 10, fps, config: { damping: 200, mass: 0.7 } });

  return (
    <AbsoluteFill style={{ ...gridBg(), fontFamily: FONT, color: C.ink }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(60% 50% at 50% 42%, rgba(37,99,235,0.13), transparent 70%)` }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 32,
            backgroundColor: C.accent,
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 74,
            fontWeight: 800,
            boxShadow: "0 30px 60px -20px rgba(37,99,235,0.55)",
            scale: interpolate(masuk, [0, 1], [0.6, 1]),
            opacity: interpolate(masuk, [0, 1], [0, 1]),
            rotate: `${interpolate(masuk, [0, 1], [-8, 0])}deg`,
          }}
        >
          K
        </div>

        <div style={{ textAlign: "center", opacity: interpolate(teks, [0, 1], [0, 1]) }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: -3.5,
              translate: `0 ${interpolate(teks, [0, 1], [24, 0])}px`,
            }}
          >
            Kelas-Sim
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 34,
              color: C.muted,
              fontWeight: 500,
              translate: `0 ${interpolate(teks, [0, 1], [18, 0])}px`,
            }}
          >
            Ruang kelas yang nyaman, dihitung dulu.
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 14,
            opacity: interpolate(frame, [26, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: `0 ${interpolate(frame, [26, 44], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px`,
          }}
        >
          {["Next.js", "Three.js", "Tailwind v4", "Remotion"].map((t) => (
            <span
              key={t}
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: C.muted,
                border: `1px solid ${C.line}`,
                backgroundColor: C.panel,
                borderRadius: 99,
                padding: "10px 22px",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 76,
            fontSize: 24,
            color: C.muted,
            opacity: interpolate(frame, [36, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          github.com/zhilana/kelas-sim
        </div>
      </div>
    </AbsoluteFill>
  );
};
