/**
 * GateMatrices.ts
 *
 * The 2×2 complex unitary matrix for each supported single-qubit gate.
 * These are the textbook quantum gate definitions; the simulator
 * (QuantumSimulator.ts) applies them to the statevector.
 */
import { Complex } from "scenerystack/dot";
import type { GateType } from "./GateType.js";

/** A 2×2 matrix of complex numbers, row-major: m[row][col]. */
export type Complex2x2 = readonly [readonly [Complex, Complex], readonly [Complex, Complex]];

const INV_SQRT2 = 1 / Math.SQRT2;

export const GATE_MATRICES: Record<GateType, Complex2x2> = {
  // Hadamard: (1/√2)[[1, 1], [1, -1]]
  H: [
    [Complex.real(INV_SQRT2), Complex.real(INV_SQRT2)],
    [Complex.real(INV_SQRT2), Complex.real(-INV_SQRT2)],
  ],
  // Pauli-X (NOT): [[0, 1], [1, 0]]
  X: [
    [Complex.ZERO, Complex.ONE],
    [Complex.ONE, Complex.ZERO],
  ],
  // Pauli-Y: [[0, -i], [i, 0]]
  Y: [
    [Complex.ZERO, new Complex(0, -1)],
    [Complex.I, Complex.ZERO],
  ],
  // Pauli-Z: [[1, 0], [0, -1]]
  Z: [
    [Complex.ONE, Complex.ZERO],
    [Complex.ZERO, Complex.real(-1)],
  ],
  // Phase (S): [[1, 0], [0, i]]
  S: [
    [Complex.ONE, Complex.ZERO],
    [Complex.ZERO, Complex.I],
  ],
  // T: [[1, 0], [0, e^{iπ/4}]]
  T: [
    [Complex.ONE, Complex.ZERO],
    [Complex.ZERO, Complex.createPolar(1, Math.PI / 4)],
  ],
};
