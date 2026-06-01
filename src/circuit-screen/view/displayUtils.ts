/**
 * displayUtils.ts
 *
 * Small formatting helpers shared by the simulation display nodes.
 */
import type { Complex } from "scenerystack/dot";

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
