import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BottomScrim } from "../components/BrowserFrame";
import { CaptionTrack } from "../components/Still";
import { C } from "../theme";

/** Rekaman asli halaman kalkulator (60 fps), dipotong ke bagian mengetik. */
export const KalkScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas }}>
      <OffthreadVideo
        src={staticFile("raw/kalkulator-trim.mp4")}
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, 150], [1.02, 1.08]),
        }}
      />
      <BottomScrim tinggi={320} />
      <CaptionTrack
        items={[
          {
            from: 0,
            to: 150,
            no: "06",
            judul: "Kalkulator",
            ket: "Hitung luas, volume, udara segar, dan suhu — tanpa menggambar kelas",
          },
        ]}
      />
    </AbsoluteFill>
  );
};
