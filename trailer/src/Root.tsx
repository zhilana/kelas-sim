import React from "react";
import { Composition, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Trailer } from "./Trailer";

// Font yang sama dengan aplikasinya, dimuat sekali untuk semua komposisi.
loadFont({
  family: "Plus Jakarta Sans",
  url: staticFile("fonts/PlusJakartaSans.woff2"),
  weight: "400 800",
  style: "normal",
  format: "woff2",
  display: "block",
});

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Trailer"
        component={Trailer}
        durationInFrames={970}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
