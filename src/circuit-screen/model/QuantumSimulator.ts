/**
 * QuantumSimulator.ts
 *
 * A small, pedagogical CPU statevector simulator. No WebGL, no GPU — the whole
 * point is to be readable. With at most MAX_QUBITS (5) qubits the statevector has
 * at most 2^5 = 32 complex amplitudes, so plain arrays and loops are plenty fast.
 *
 * Endianness: qubit 0 is the LEAST-significant bit. Basis-state index `i` has
 * qubit `q` set iff `(i >> q) & 1`, so circuit row `q` maps to bit `q`. See
 * GateType.ts for the matching display convention.
 */
import { Complex, Vector3 } from "scenerystack/dot";
import type { Complex2x2 } from "./GateMatrices.js";
import { GATE_MATRICES } from "./GateMatrices.js";
import type { CircuitCell } from "./GateType.js";
import { cellGate, isControl, NUM_STEPS } from "./GateType.js";

/**
 * Applies a 2×2 gate matrix to one target wire, optionally conditioned on a set
 * of control wires (all controls must be |1⟩ for the gate to act).
 *
 * This is the heart of the simulator. The state is a superposition over basis
 * states; flipping `target` connects basis states that differ only in bit
 * `target`. We walk each such pair once and rotate it by the matrix `m`, but
 * only for pairs where every control bit is already 1.
 *
 * Mutates `state` in place.
 */
export function applyControlledGate(
  state: Complex[],
  target: number,
  controls: readonly number[],
  m: Complex2x2,
): void {
  const targetBit = 1 << target;
  let controlMask = 0;
  for (const c of controls) {
    controlMask |= 1 << c;
  }

  for (let i = 0; i < state.length; i++) {
    // Visit only the "0 at target" member of each pair, and only when all controls are 1.
    if ((i & targetBit) !== 0 || (i & controlMask) !== controlMask) {
      continue;
    }
    const j = i | targetBit; // partner with "1 at target"
    const a0 = state[i]!;
    const a1 = state[j]!;
    state[i] = m[0][0]!.times(a0).plus(m[0][1]!.times(a1));
    state[j] = m[1][0]!.times(a0).plus(m[1][1]!.times(a1));
  }
}

/**
 * Applies one circuit column (all cells at a given step) to the state.
 *
 * Semantics:
 *   - If the column contains one or more control dots, there must be exactly one
 *     gate-bearing wire; that gate is applied controlled by every control wire.
 *     (CNOT = X target + one control. CCX/Toffoli = X target + two controls.)
 *   - Otherwise every gate cell is an independent single-qubit gate (disjoint
 *     targets commute, so order does not matter).
 *
 * Limitation: with controls present, only the first gate-bearing wire is used as
 * the target — one controlled operation per column.
 */
function applyColumn(state: Complex[], n: number, circuit: ReadonlyArray<ReadonlyArray<CircuitCell>>, step: number): void {
  const controls: number[] = [];
  const gateWires: Array<{ wire: number; matrix: Complex2x2 }> = [];

  for (let q = 0; q < n; q++) {
    const cell = circuit[q]?.[step];
    if (cell === undefined) {
      continue;
    }
    if (isControl(cell)) {
      controls.push(q);
      continue;
    }
    const gate = cellGate(cell);
    if (gate !== null) {
      gateWires.push({ wire: q, matrix: GATE_MATRICES[gate] });
    }
  }

  if (controls.length > 0) {
    // Controlled operation: apply the first gate target conditioned on all controls.
    const targetGate = gateWires[0];
    if (targetGate !== undefined) {
      applyControlledGate(state, targetGate.wire, controls, targetGate.matrix);
    }
    // Stray controls with no target are a no-op (documented).
  } else {
    for (const { wire, matrix } of gateWires) {
      applyControlledGate(state, wire, [], matrix);
    }
  }
}

/**
 * Simulates the circuit from |0…0⟩ and returns the final statevector
 * (length 2^n). Only the first `n` qubit rows participate.
 */
export function simulate(circuit: ReadonlyArray<ReadonlyArray<CircuitCell>>, n: number): Complex[] {
  const dim = 1 << n;
  const state: Complex[] = new Array(dim);
  state[0] = Complex.ONE;
  for (let i = 1; i < dim; i++) {
    state[i] = Complex.ZERO;
  }

  for (let step = 0; step < NUM_STEPS; step++) {
    applyColumn(state, n, circuit, step);
  }
  return state;
}

/**
 * Computes the per-qubit reduced Bloch vector (⟨X⟩, ⟨Y⟩, ⟨Z⟩) for each of the
 * first `n` qubits, directly from the full statevector expectation values.
 *
 * A vector shorter than unit length signals a mixed reduced state — i.e. that
 * qubit is entangled with the rest of the register. That shortening is exactly
 * what makes entanglement visible on the Bloch display.
 */
export function computeBlochVectors(state: Complex[], n: number): Vector3[] {
  const out: Vector3[] = [];
  for (let q = 0; q < n; q++) {
    const bit = 1 << q;
    let x = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i < state.length; i++) {
      const amp = state[i]!;
      const p = amp.magnitudeSquared;
      z += ((i & bit) === 0 ? 1 : -1) * p;
      if ((i & bit) === 0) {
        const prod = amp.conjugated().times(state[i | bit]!);
        x += 2 * prod.real;
        y += 2 * prod.imaginary;
      }
    }
    out.push(new Vector3(x, y, z));
  }
  return out;
}
