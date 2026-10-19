"use client";

import { ChangeEvent } from "react";

/**
 * Kontrol angka ganda: slider (mulai geser cepat) + kotak angka (presisi).
 * Keduanya menunjuk state yang sama — menggeser salah satu menggerakkan
 * keduanya. Dipakai di simulator & kalkulator supaya nuansanya konsisten.
 */
export default function SliderNum({
  label,
  value,
  onValue,
  min,
  max,
  step = 1,
  satuan,
}: {
  label: string;
  value: string;
  onValue: (v: string) => void;
  min: number;
  max: number;
  step?: number;
  satuan?: string;
}) {
  const angka = Number(value);
  const aman = Number.isFinite(angka) ? angka : min;
  const geser = Math.min(max, Math.max(min, aman));

  const fin = (e: ChangeEvent<HTMLInputElement>) => onValue(e.target.value);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="block text-[11px] font-medium tracking-wide text-muted">
          {label}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-ink">
          {satuan ? `${geser.toLocaleString("id-ID")} ${satuan}` : geser.toLocaleString("id-ID")}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={geser}
          onChange={fin}
          className="min-w-0 flex-1"
          aria-label={label}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={fin}
          className="w-16 shrink-0 rounded-md border border-line bg-canvas px-1.5 py-1 text-center text-xs tabular-nums outline-none transition-colors focus:border-accent"
        />
      </div>
    </div>
  );
}
