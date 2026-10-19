import React from "react";
import { AbsoluteFill } from "remotion";
import { BottomScrim, masih } from "../components/BrowserFrame";
import { CaptionTrack, StillStack } from "../components/Still";
import { C } from "../theme";

export const MenuScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas }}>
      <StillStack
        durasi={210}
        items={[
          { src: masih("menu-idle"), from: 0, to: 110, dari: 1.02, ke: 1.07, geserX: -10 },
          { src: masih("menu-hover-2"), from: 92, to: 168, dari: 1.05, ke: 1.09, geserX: 8 },
          { src: masih("menu-hover-3"), from: 150, to: 210, dari: 1.06, ke: 1.1, geserX: -6 },
        ]}
      />
      <BottomScrim tinggi={320} />
      <CaptionTrack
        items={[
          {
            from: 0,
            to: 110,
            no: "01",
            judul: "Tiga pintu masuk",
            ket: "Mulai Simulasi · Kalkulator · Bahan Bangunan",
          },
          {
            from: 110,
            to: 210,
            no: "02",
            judul: "Menu di kiri, kelas 3D di kanan",
            ket: "Arahkan kursor — objeknya ikut membesar, klik untuk masuk",
          },
        ]}
      />
    </AbsoluteFill>
  );
};
