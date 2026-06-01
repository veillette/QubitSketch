/**
 * CircuitCanvas.ts
 *
 * Renders the quantum circuit grid — qubit labels, horizontal wire lines,
 * and a grid of clickable gate slots. Clicking a slot applies the currently
 * selected tool via model.placeCell().
 *
 * Cell kinds are rendered as:
 *   gate / controlledTarget — a colored GateNode (the gate letter)
 *   control                 — a filled control dot (•) with a vertical connector
 *                             line to the gate target in the same column
 *
 * Layout (all values in SceneryStack's virtual coordinate space):
 *   - LABEL_WIDTH  — left-side qubit labels (q₀, q₁, …)
 *   - SLOT_SIZE    — size of each gate cell (width = height)
 *   - SLOT_GAP     — gap between consecutive cells
 *   - WIRE_EXTEND  — how far the wire extends past the last slot
 */
import type { Vector2 } from "scenerystack/dot";
import { Circle, Line, Node, Rectangle, Text } from "scenerystack/scenery";
import QubitSketchColors from "../../QubitSketchColors.js";
import type { CircuitCell } from "../model/GateType.js";
import { cellGate, MAX_QUBITS, NUM_STEPS } from "../model/GateType.js";
import type { QubitSketchModel } from "../model/QubitSketchModel.js";
import { GateNode } from "./GateNode.js";

const LABEL_WIDTH = 52;
const SLOT_SIZE = 50;
const SLOT_GAP = 8;
const WIRE_EXTEND = 12;
const QUBIT_ROW_HEIGHT = SLOT_SIZE + SLOT_GAP;
const CONTROL_DOT_RADIUS = 7;

// Total canvas dimensions (sized for MAX_QUBITS rows, NUM_STEPS columns)
export const CIRCUIT_CANVAS_WIDTH = LABEL_WIDTH + NUM_STEPS * SLOT_SIZE + (NUM_STEPS - 1) * SLOT_GAP + WIRE_EXTEND;
export const CIRCUIT_CANVAS_HEIGHT = MAX_QUBITS * QUBIT_ROW_HEIGHT - SLOT_GAP;

/** The grid as a drag-and-drop drop target (implemented by CircuitCanvas). */
export interface SlotDropTarget {
  slotIndexAt(globalPoint: Vector2, qubitCount: number): { qubit: number; step: number } | null;
}

const slotX = (step: number): number => LABEL_WIDTH + step * (SLOT_SIZE + SLOT_GAP);
const rowY = (qubit: number): number => qubit * QUBIT_ROW_HEIGHT;
const slotCenterX = (step: number): number => slotX(step) + SLOT_SIZE / 2;
const slotCenterY = (qubit: number): number => rowY(qubit) + SLOT_SIZE / 2;

export class CircuitCanvas extends Node {
  /** The node currently rendered in each cell (gate, control dot, …) or null. */
  private readonly cellNodes: Array<Array<Node | null>>;
  /** The cell content last rendered in each position, to detect changes. */
  private readonly renderedCells: CircuitCell[][];
  private readonly qubitRows: Node[];
  /** Layer holding control→target connector lines, one per column. */
  private readonly connectorLayer: Node;
  private readonly connectors: Array<Line | null>;

  public constructor(model: QubitSketchModel) {
    super();

    this.cellNodes = [];
    this.renderedCells = [];
    this.qubitRows = [];
    this.connectors = Array.from({ length: NUM_STEPS }, () => null);

    this.connectorLayer = new Node({ pickable: false });

    // Build one row per qubit (up to MAX_QUBITS; hidden rows are toggled by qubitCountProperty)
    for (let q = 0; q < MAX_QUBITS; q++) {
      const wireCenterY = slotCenterY(q);

      const rowNode = new Node();
      this.addChild(rowNode);
      this.qubitRows.push(rowNode);

      // Qubit label
      const label = new Text(`q${q}`, {
        font: "bold 16px monospace",
        fill: QubitSketchColors.textColorProperty,
        right: LABEL_WIDTH - 6,
        centerY: wireCenterY,
        pickable: false,
      });
      rowNode.addChild(label);

      // Horizontal wire spanning all slots
      const wireStart = LABEL_WIDTH;
      const wireEnd = LABEL_WIDTH + NUM_STEPS * SLOT_SIZE + (NUM_STEPS - 1) * SLOT_GAP + WIRE_EXTEND;
      const wire = new Rectangle(wireStart, wireCenterY - 1, wireEnd - wireStart, 2, {
        fill: QubitSketchColors.wireColorProperty,
        pickable: false,
      });
      rowNode.addChild(wire);

      const nodeRow: Array<Node | null> = [];
      const cellRow: CircuitCell[] = [];

      // Gate slots
      for (let s = 0; s < NUM_STEPS; s++) {
        const stepIndex = s;

        const slot = new Rectangle(slotX(s), rowY(q), SLOT_SIZE, SLOT_SIZE, {
          fill: QubitSketchColors.slotBackgroundColorProperty,
          stroke: QubitSketchColors.slotBorderColorProperty,
          lineWidth: 1,
          cornerRadius: 4,
          cursor: "pointer",
        });
        rowNode.addChild(slot);
        nodeRow.push(null);
        cellRow.push({ kind: "empty" });

        // Hover effect + click-to-place
        slot.addInputListener({
          over: () => {
            slot.fill = QubitSketchColors.slotHoverColorProperty;
          },
          out: () => {
            slot.fill = QubitSketchColors.slotBackgroundColorProperty;
          },
          down: () => {
            model.placeCell(q, stepIndex);
          },
        });
      }

      this.cellNodes.push(nodeRow);
      this.renderedCells.push(cellRow);
    }

    // Connector lines draw on top of the wires but below the gate/control nodes' rows.
    this.addChild(this.connectorLayer);

    // React to circuit changes — update gate/control nodes and connectors
    model.circuitProperty.link((circuit) => {
      this.updateCellNodes(circuit);
      this.updateConnectors(circuit, model.qubitCountProperty.value);
    });

    // React to qubit count changes — show/hide rows and refresh connectors
    model.qubitCountProperty.link((count) => {
      for (let q = 0; q < MAX_QUBITS; q++) {
        const row = this.qubitRows[q];
        if (row !== undefined) {
          row.visible = q < count;
        }
      }
      this.updateConnectors(model.circuitProperty.value, count);
    });
  }

  /** Builds the visual node for a cell, positioned within its slot, or null if empty. */
  private makeCellNode(cell: CircuitCell, step: number, qubit: number): Node | null {
    if (cell.kind === "control") {
      return new Circle(CONTROL_DOT_RADIUS, {
        fill: QubitSketchColors.controlDotColorProperty,
        centerX: slotCenterX(step),
        centerY: slotCenterY(qubit),
        pickable: false,
      });
    }
    const gate = cellGate(cell);
    if (gate !== null) {
      const gateNode = new GateNode(gate, SLOT_SIZE - 4);
      gateNode.x = slotX(step) + 2;
      gateNode.y = rowY(qubit) + 2;
      gateNode.pickable = false;
      return gateNode;
    }
    return null;
  }

  private cellsEqual(a: CircuitCell, b: CircuitCell): boolean {
    if (a.kind !== b.kind) {
      return false;
    }
    return cellGate(a) === cellGate(b);
  }

  private updateCellNodes(circuit: ReadonlyArray<ReadonlyArray<CircuitCell>>): void {
    for (let q = 0; q < MAX_QUBITS; q++) {
      const row = this.qubitRows[q];
      const nodeRow = this.cellNodes[q];
      const cellRow = this.renderedCells[q];
      if (row === undefined || nodeRow === undefined || cellRow === undefined) {
        continue;
      }
      for (let s = 0; s < NUM_STEPS; s++) {
        const cell = circuit[q]?.[s] ?? { kind: "empty" };
        if (this.cellsEqual(cell, cellRow[s]!)) {
          continue;
        }
        // Remove the old node, if any.
        const old = nodeRow[s];
        if (old !== null && old !== undefined) {
          row.removeChild(old);
        }
        // Build the replacement.
        const fresh = this.makeCellNode(cell, s, q);
        if (fresh !== null) {
          row.addChild(fresh);
        }
        nodeRow[s] = fresh;
        cellRow[s] = cell;
      }
    }
  }

  /**
   * Draws a vertical connector line per column from the topmost to the bottommost
   * occupied wire whenever that column contains a control dot (so the user sees
   * which target the control acts on).
   */
  private updateConnectors(circuit: ReadonlyArray<ReadonlyArray<CircuitCell>>, qubitCount: number): void {
    for (let s = 0; s < NUM_STEPS; s++) {
      const existing = this.connectors[s];
      if (existing !== null && existing !== undefined) {
        this.connectorLayer.removeChild(existing);
        this.connectors[s] = null;
      }

      let hasControl = false;
      let top = -1;
      let bottom = -1;
      for (let q = 0; q < qubitCount; q++) {
        const cell = circuit[q]?.[s] ?? { kind: "empty" };
        if (cell.kind === "empty") {
          continue;
        }
        if (cell.kind === "control") {
          hasControl = true;
        }
        if (top === -1) {
          top = q;
        }
        bottom = q;
      }

      if (hasControl && top !== -1 && bottom > top) {
        const line = new Line(slotCenterX(s), slotCenterY(top), slotCenterX(s), slotCenterY(bottom), {
          stroke: QubitSketchColors.controlDotColorProperty,
          lineWidth: 2,
          pickable: false,
        });
        this.connectorLayer.addChild(line);
        this.connectors[s] = line;
      }
    }
  }

  /**
   * Maps a global point to the {qubit, step} slot it falls in, or null if it is
   * outside the grid / on a hidden qubit row. Used by drag-and-drop placement.
   */
  public slotIndexAt(globalPoint: Vector2, qubitCount: number): { qubit: number; step: number } | null {
    const local = this.globalToLocalPoint(globalPoint);
    const step = Math.floor((local.x - LABEL_WIDTH) / (SLOT_SIZE + SLOT_GAP));
    const qubit = Math.floor(local.y / QUBIT_ROW_HEIGHT);
    if (step < 0 || step >= NUM_STEPS || qubit < 0 || qubit >= qubitCount) {
      return null;
    }
    // Reject points that fall in the inter-slot gap.
    if (local.x - slotX(step) > SLOT_SIZE || local.y - rowY(qubit) > SLOT_SIZE) {
      return null;
    }
    return { qubit, step };
  }
}
