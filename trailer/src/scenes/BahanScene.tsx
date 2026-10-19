import React from "react";
import { AbsoluteFill } from "remotion";
import { BottomScrim, masih } from "../components/BrowserFrame";
import { CaptionTrack, StillStack } from "../components/Still";
import { C } from "../theme";

export const BahanScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas }}>
      <StillStack
        durasi={180}
        items={[
          { src: masih("bahan-bata"), from: 0, to: 58, dari: 1.03, ke: 1.09 },
          { src: masih("bahan-batako"), from: 48, to: 104, dari: 1.04, ke: 1.1, geserX: -8 },
          { src: masih("bahan-kaca"), from: 94, to: 144, dari: 1.04, ke: 1.1, geserX: 8 },
          { src: masih("bahan-baja"), from: 134, to: 180, dari: 1.04, ke: 1.1, geserY: -8 },
        ]}
      />
      <BottomScrim tinggi={320} />
      <CaptionTrack
        items={[
          { from: 0, to: 54, no: "07", judul: "Bata Merah", ket: "Dinding kelas · U 2,0 W/m²K · meredam panas" },
          { from: 54, to: 100, judul: "Batako Semen", ket: "Dinding gudang & kantin · cepat dipasang" },
          { from: 100, to: 140, judul: "Kaca Bening", ket: "Jendela kelas · U 5,8 W/m²K · paling menghantarkan panas" },
          { from: 140, to: 180, judul: "Baja Ringan C75", ket: "Rangka atap & plafon · anti rayap" },
        ]}
      />
    </AbsoluteFill>
  );
};
