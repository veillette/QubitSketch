/**
 * GateType.ts
 *
 * Defines the set of supported single-qubit quantum gates and the data types
 * used to describe a circuit grid.
 *
 * Endianness convention (used everywhere — simulator and displays):
 *   qubit 0 is the LEAST-significant bit. A basis-state index `i` has qubit `q`
 *   set iff `(i >> q) & 1`. The model row `circuit[q]` therefore maps directly to
 *   bit `q`. Kets are displayed big-endian as |q_{n-1} … q_1 q_0⟩.
 */

export const GateType = {
  H: "H", // Hadamard — creates equal superposition: |0⟩→(|0⟩+|1⟩)/√2
  X: "X", // Pauli-X — quantum NOT gate: |0⟩↔|1⟩
  Y: "Y", // Pauli-Y — combined bit and phase flip
  Z: "Z", // Pauli-Z — phase flip: |1⟩→-|1⟩
  S: "S", // Phase (S) gate — adds π/2 phase to |1⟩
  T: "T", // T gate — adds π/4 phase to |1⟩
} as const;

export type GateType = (typeof GateType)[keyof typeof GateType];

/**
 * A single cell in the circuit grid — a discriminated union.
 *   empty            — nothing placed
 *   gate             — a plain single-qubit gate
 *   control          — a control dot (•); makes gates in the SAME column controlled
 *   controlledTarget — the target of a controlled operation (defaults to X = CNOT);
 *                      semantically identical to a gate sharing a column with a control,
 *                      but tagged so the view can draw it differently.
 */
export type CircuitCell =
  | { readonly kind: "empty" }
  | { readonly kind: "gate"; readonly gate: GateType }
  | { readonly kind: "control" }
  | { readonly kind: "controlledTarget"; readonly gate: GateType };

export const EMPTY_CELL: CircuitCell = { kind: "empty" };

/** True if the cell is a control dot. */
export function isControl(cell: CircuitCell): boolean {
  return cell.kind === "control";
}

/** Returns the gate this cell applies, or null if it bears no gate. */
export function cellGate(cell: CircuitCell): GateType | null {
  return cell.kind === "gate" || cell.kind === "controlledTarget" ? cell.gate : null;
}

/** The currently active placement tool (a gate type, the control dot, or the eraser). */
export type SelectedTool = GateType | "control" | "eraser";

export const NUM_STEPS = 8;
export const MAX_QUBITS = 5;
export const MIN_QUBITS = 1;
