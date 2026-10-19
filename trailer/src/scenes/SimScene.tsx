import React from "react";
import { AbsoluteFill } from "remotion";
import { BottomScrim, masih } from "../components/BrowserFrame";
import { CaptionTrack, StillStack } from "../components/Still";
import { C } from "../theme";

export const SimScene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas }}>
      <StillStack
        durasi={240}
        items={[
          { src: masih("sim-form"), from: 0, to: 78, dari: 1.02, ke: 1.08, geserY: -14 },
          { src: masih("sim-popup"), from: 62, to: 126, dari: 1.04, ke: 1.1, geserY: 10 },
          { src: masih("sim-orbit"), from: 112, to: 186, dari: 1.04, ke: 1.12, geserX: -18 },
          { src: masih("sim-atas"), from: 172, to: 214, dari: 1.04, ke: 1.12, geserX: 14 },
          { src: masih("sim-depan"), from: 200, to: 240, dari: 1.05, ke: 1.13, geserY: -10 },
        ]}
      />
      <BottomScrim tinggi={320} />
      <CaptionTrack
        items={[
          { from: 0, to: 74, no: "03", judul: "Susun ruangan & siswa", ket: "Panjang, lebar, jendela, angin — semuanya bisa diubah" },
          { from: 74, to: 118, no: "04", judul: "Langsung dapat peringkat", ket: "S++ sampai F, lengkap dengan alasannya" },
          { from: 118, to: 172, no: "05", judul: "Kelasnya dibangun 3D", ket: "32 siswa, 5 kolom, meja guru di pojok depan" },
          { from: 172, to: 204, judul: "Atas — cek tata letak", ket: "Lihat dari plafon: kepadatan dan sirkulasi" },
          { from: 204, to: 240, judul: "Depan — dari kursi guru", ket: "Sudut pandang yang paling sering dipakai" },
        ]}
      />
    </AbsoluteFill>
  );
};
