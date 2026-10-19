import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, gridBg } from "../theme";

const Baris: React.FC<{ children: React.ReactNode; delay: number }> = ({ children, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.6 } });
  return (
    <div
      style={{
        opacity: interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        translate: `0 ${interpolate(s, [0, 1], [56, 0])}px`,
        overflow: "hidden",
        paddingBottom: 6,
      }}
    >
      {children}
    </div>
  );
};

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const garis = interpolate(frame, [46, 74], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ ...gridBg(), fontFamily: FONT, color: C.ink }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 55% at 78% 28%, rgba(37,99,235,0.14), transparent 70%)`,
        }}
      />
      {/* merek */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 96,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" }),
          translate: `0 ${interpolate(frame, [0, 14], [-14, 0], { extrapolateRight: "clamp" })}px`,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            backgroundColor: C.accent,
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          K
        </div>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>Kelas-Sim</span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.muted,
            border: `1px solid ${C.line}`,
            borderRadius: 99,
            padding: "4px 12px",
          }}
        >
          v0.3
        </span>
      </div>

      {/* judul */}
      <div style={{ position: "absolute", left: 110, top: 330, maxWidth: 1180 }}>
        <div style={{ fontSize: 112, fontWeight: 800, lineHeight: 1.02, letterSpacing: -4 }}>
          <Baris delay={8}>
            Ruang kelas
          </Baris>
          <Baris delay={16}>
            yang nyaman,
          </Baris>
          <Baris delay={24}>
            <span style={{ position: "relative", display: "inline-block" }}>
              dihitung dulu.
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 8,
                  height: 10,
                  width: `${garis * 100}%`,
                  backgroundColor: C.accent,
                  opacity: 0.35,
                  borderRadius: 6,
                }}
              />
            </span>
          </Baris>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 112,
          top: 790,
          maxWidth: 760,
          fontSize: 32,
          lineHeight: 1.5,
          color: C.muted,
          opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: `0 ${interpolate(frame, [40, 60], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px`,
        }}
      >
        Simulator kenyamanan ruang kelas — suhu, aliran udara, dan panas matahari, dihitung
        langsung sambil kelasnya dibangun dalam 3D.
      </div>

      {/* angka besar dekoratif */}
      <div
        style={{
          position: "absolute",
          right: 96,
          bottom: 70,
          fontSize: 176,
          fontWeight: 800,
          letterSpacing: -8,
          color: C.accent,
          opacity: interpolate(frame, [30, 60], [0, 0.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        36°C
      </div>

      {/* kilau masuk */}
      <AbsoluteFill
        style={{
          backgroundColor: C.canvas,
          opacity: interpolate(frame, [0, 10], [1, 0], { extrapolateRight: "clamp" }),
        }}
      />
      <div style={{ opacity: spring({ frame, fps, config: { damping: 200 } }) }} />
    </AbsoluteFill>
  );
};
