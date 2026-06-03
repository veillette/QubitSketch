/**
 * displayUtils.ts
 *
 * Small formatting helpers shared by the simulation display nodes.
 */
import type { Complex } from "scenerystack/dot";
import { Color } from "scenerystack/scenery";

/** Saturation/lightness used to render phase as a hue (kept consistent across displays). */
const PHASE_SATURATION = 0.72;
const PHASE_LIGHTNESS = 0.55;
/** Color used when a phase is undefined (amplitude ≈ 0). */
const NEUTRAL_PHASE_COLOR = new Color(120, 120, 120);

/** Converts an HSL triple (h in degrees, s/l in [0,1]) to a Scenery Color. */
function hslColor(hDegrees: number, s: number, l: number): Color {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((hDegrees % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) {
    [r, g, b] = [c, x, 0];
  } else if (hp < 2) {
    [r, g, b] = [x, c, 0];
  } else if (hp < 3) {
    [r, g, b] = [0, c, x];
  } else if (hp < 4) {
    [r, g, b] = [0, x, c];
  } else if (hp < 5) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  const m = l - c / 2;
  return new Color(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
}

/** Maps a phase angle (radians) to a hue, so phase relationships read as color. */
export function phaseAngleToColor(phaseRadians: number): Color {
  return hslColor((phaseRadians * 180) / Math.PI, PHASE_SATURATION, PHASE_LIGHTNESS);
}

/** Color for an amplitude's phase, or a neutral gray when the amplitude is ≈ 0 (phase undefined). */
export function phaseToColor(amp: Complex, threshold = 1e-9): Color {
  return amp.magnitudeSquared < threshold ? NEUTRAL_PHASE_COLOR : phaseAngleToColor(amp.phase());
}

/**
 * Big-endian ket label for basis-state index `i` on `n` qubits, e.g. i=2, n=3 → "|010⟩".
 * (Qubit 0 is the least-significant bit, so it is the rightmost digit — see GateType.ts.)
 */
export function ketLabel(i: number, n: number): string {
  let bits = "";
  for (let q = n - 1; q >= 0; q--) {
    bits += (i >> q) & 1;
  }
  return `|${bits}⟩`;
}

/** Formats a complex amplitude as "a+bi" with fixed precision (e.g. "0.71+0.00i"). */
export function formatComplex(c: Complex, digits = 2): string {
  const re = c.real.toFixed(digits);
  const im = Math.abs(c.imaginary).toFixed(digits);
  const sign = c.imaginary < 0 ? "−" : "+";
  return `${re}${sign}${im}i`;
}

/** Formats a phase in radians as a degree string (e.g. "90°"); blank for ~zero amplitude. */
export function formatPhase(c: Complex, threshold = 1e-9): string {
  if (c.magnitudeSquared < threshold) {
    return "—";
  }
  const deg = (c.phase() * 180) / Math.PI;
  return `${deg.toFixed(0)}°`;
}
