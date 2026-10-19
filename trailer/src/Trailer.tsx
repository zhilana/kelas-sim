import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Intro } from "./scenes/Intro";
import { MenuScene } from "./scenes/MenuScene";
import { SimScene } from "./scenes/SimScene";
import { KalkScene } from "./scenes/KalkScene";
import { BahanScene } from "./scenes/BahanScene";
import { Outro } from "./scenes/Outro";
import { C } from "./theme";

const T = 16; // durasi transisi (frame)

export const Trailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Intro" durationInFrames={120}>
          <Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence name="Menu" durationInFrames={210}>
          <MenuScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence name="Simulasi" durationInFrames={240}>
          <SimScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence name="Kalkulator" durationInFrames={150}>
          <KalkScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence name="Bahan" durationInFrames={180}>
          <BahanScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

        <TransitionSeries.Sequence name="Outro" durationInFrames={150}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
