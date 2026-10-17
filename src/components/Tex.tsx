"use client";

import { useMemo } from "react";
import katex from "katex";

/** Render rumus LaTeX dengan KaTeX (aman, throwOnError dimatikan). */
export default function Tex({ tex, className }: { tex: string; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, output: "html" });
    } catch {
      return tex;
    }
  }, [tex]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
