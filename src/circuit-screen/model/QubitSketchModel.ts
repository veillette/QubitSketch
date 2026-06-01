/**
 * QubitSketchModel.ts
 *
 * Top-level model for the quantum circuit builder screen.
 *
 * State:
 *   qubitCountProperty   — number of visible qubit wires (1–MAX_QUBITS)
 *   selectedToolProperty — which tool (gate, control, or eraser) the user has selected
 *   circuitProperty      — the 2-D circuit grid: circuit[qubit][step]
 *
 * Derived (live simulation — see QuantumSimulator.ts):
 *   stateVectorProperty   — Complex amplitudes of length 2^qubitCount
 *   probabilitiesProperty — |amplitude|² per basis state
 *   blochVectorsProperty  — per-qubit reduced Bloch vector (Vector3)
 */
import { DerivedProperty, NumberProperty, Property, type ReadOnlyProperty } from "scenerystack/axon";
import type { Complex, Vector3 } from "scenerystack/dot";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import type { CircuitCell, GateType, SelectedTool } from "./GateType.js";
import { EMPTY_CELL, isControl, MAX_QUBITS, MIN_QUBITS, NUM_STEPS } from "./GateType.js";
import { computeBlochVectors, simulate } from "./QuantumSimulator.js";

export class QubitSketchModel implements TModel {
  public readonly qubitCountProperty = new NumberProperty(3, {
    range: new Range(MIN_QUBITS, MAX_QUBITS),
    numberType: "Integer",
  });

  public readonly selectedToolProperty: Property<SelectedTool> = new Property<SelectedTool>("H");

  /** circuit[qubitIndex][stepIndex] */
  public readonly circuitProperty: Property<ReadonlyArray<ReadonlyArray<CircuitCell>>>;

  /** Live statevector — recomputed whenever the circuit or qubit count changes. */
  public readonly stateVectorProperty: ReadOnlyProperty<Complex[]>;

  /** Measurement probability of each computational basis state. */
  public readonly probabilitiesProperty: ReadOnlyProperty<number[]>;

  /** Per-qubit reduced Bloch vector (length < 1 ⇒ mixed/entangled). */
  public readonly blochVectorsProperty: ReadOnlyProperty<Vector3[]>;

  public constructor() {
    this.circuitProperty = new Property<ReadonlyArray<ReadonlyArray<CircuitCell>>>(QubitSketchModel.emptyCircuit());

    this.stateVectorProperty = new DerivedProperty(
      [this.circuitProperty, this.qubitCountProperty],
      (circuit, n) => simulate(circuit, n),
    );

    this.probabilitiesProperty = new DerivedProperty([this.stateVectorProperty], (state) =>
      state.map((amp) => amp.magnitudeSquared),
    );

    this.blochVectorsProperty = new DerivedProperty(
      [this.stateVectorProperty, this.qubitCountProperty],
      (state, n) => computeBlochVectors(state, n),
    );
  }

  private static emptyCircuit(): ReadonlyArray<ReadonlyArray<CircuitCell>> {
    return Array.from({ length: MAX_QUBITS }, () =>
      Array.from({ length: NUM_STEPS }, (): CircuitCell => EMPTY_CELL),
    );
  }

  /** True if any cell in the given step (column) is a control dot. */
  private columnHasControl(stepIndex: number, exceptQubit: number): boolean {
    const circuit = this.circuitProperty.value;
    for (let q = 0; q < MAX_QUBITS; q++) {
      if (q !== exceptQubit && isControl(circuit[q]?.[stepIndex] ?? EMPTY_CELL)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Applies the currently selected tool to the given grid position.
   *   - gate tool:  places the gate (as a controlled target if its column has a control);
   *                 clicking the same gate again clears the cell.
   *   - control:    toggles a control dot.
   *   - eraser:     clears the cell.
   */
  public placeCell(qubitIndex: number, stepIndex: number): void {
    const tool = this.selectedToolProperty.value;
    const current = this.circuitProperty.value[qubitIndex]?.[stepIndex] ?? EMPTY_CELL;

    let next: CircuitCell;
    if (tool === "eraser") {
      next = EMPTY_CELL;
    } else if (tool === "control") {
      next = current.kind === "control" ? EMPTY_CELL : { kind: "control" };
    } else {
      const gate: GateType = tool;
      const sameGate = (current.kind === "gate" || current.kind === "controlledTarget") && current.gate === gate;
      if (sameGate) {
        next = EMPTY_CELL;
      } else if (this.columnHasControl(stepIndex, qubitIndex)) {
        next = { kind: "controlledTarget", gate };
      } else {
        next = { kind: "gate", gate };
      }
    }
    this.setCell(qubitIndex, stepIndex, next);
  }

  public setCell(qubitIndex: number, stepIndex: number, cell: CircuitCell): void {
    const updated = this.circuitProperty.value.map((row, q) =>
      q === qubitIndex ? row.map((c, s) => (s === stepIndex ? cell : c)) : row,
    );
    this.circuitProperty.set(updated);
  }

  /** Clears a single cell (used by drag-off-grid deletion). */
  public removeCell(qubitIndex: number, stepIndex: number): void {
    this.setCell(qubitIndex, stepIndex, EMPTY_CELL);
  }

  public clearCircuit(): void {
    this.circuitProperty.set(QubitSketchModel.emptyCircuit());
  }

  public reset(): void {
    this.qubitCountProperty.reset();
    this.selectedToolProperty.reset();
    this.circuitProperty.set(QubitSketchModel.emptyCircuit());
  }

  public step(_dt: number): void {}
}
