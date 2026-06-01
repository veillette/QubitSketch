/**
 * GatePalettePanel.ts
 *
 * A vertical panel of gate-selection buttons. Clicking a button sets
 * model.selectedToolProperty to that gate type. An eraser button is
 * included at the bottom for removing gates from the circuit.
 *
 * The active tool is shown with a highlight border.
 */
import { Circle, DragListener, Node, Rectangle, Text } from "scenerystack/scenery";
import QubitSketchColors from "../../QubitSketchColors.js";
import type { SelectedTool } from "../model/GateType.js";
import { GateType } from "../model/GateType.js";
import type { QubitSketchModel } from "../model/QubitSketchModel.js";
import type { SlotDropTarget } from "./CircuitCanvas.js";
import { GateNode } from "./GateNode.js";

/** Where dragged gates float and land. Supplied by CircuitScreenView. */
export interface PaletteDragContext {
  readonly dragLayer: Node;
  readonly dropTarget: SlotDropTarget;
}

const BUTTON_SIZE = 52;
const BUTTON_GAP = 8;
const PANEL_PADDING = 10;
const HIGHLIGHT_INSET = 3;

const ALL_TOOLS: SelectedTool[] = [
  GateType.H,
  GateType.X,
  GateType.Y,
  GateType.Z,
  GateType.S,
  GateType.T,
  "control",
  "eraser",
];

type ButtonEntry = { tool: SelectedTool; highlight: Rectangle };

export class GatePalettePanel extends Node {
  public constructor(model: QubitSketchModel, dragContext?: PaletteDragContext) {
    super();

    const panelHeight = ALL_TOOLS.length * (BUTTON_SIZE + BUTTON_GAP) - BUTTON_GAP + PANEL_PADDING * 2;
    const panelWidth = BUTTON_SIZE + PANEL_PADDING * 2;

    const background = new Rectangle(0, 0, panelWidth, panelHeight, {
      fill: QubitSketchColors.panelBackgroundColorProperty,
      stroke: QubitSketchColors.panelBorderColorProperty,
      lineWidth: 1,
      cornerRadius: 8,
    });
    this.addChild(background);

    const buttonEntries: ButtonEntry[] = [];

    for (let i = 0; i < ALL_TOOLS.length; i++) {
      const tool = ALL_TOOLS[i]!;
      const btnX = PANEL_PADDING;
      const btnY = PANEL_PADDING + i * (BUTTON_SIZE + BUTTON_GAP);

      // Selection highlight — a border drawn around the button when it is active
      const highlight = new Rectangle(
        btnX - HIGHLIGHT_INSET,
        btnY - HIGHLIGHT_INSET,
        BUTTON_SIZE + HIGHLIGHT_INSET * 2,
        BUTTON_SIZE + HIGHLIGHT_INSET * 2,
        {
          fill: null,
          stroke: QubitSketchColors.selectedToolHighlightColorProperty,
          lineWidth: HIGHLIGHT_INSET,
          cornerRadius: 9,
          visible: false,
          pickable: false,
        },
      );
      this.addChild(highlight);

      const buttonNode = makeToolNode(tool, BUTTON_SIZE);
      buttonNode.x = btnX;
      buttonNode.y = btnY;
      buttonNode.pickable = false;
      this.addChild(buttonNode);

      // Transparent hit-area on top so clicks always register
      const hitArea = new Rectangle(btnX, btnY, BUTTON_SIZE, BUTTON_SIZE, {
        fill: "rgba(0,0,0,0)",
        cursor: "pointer",
      });

      if (dragContext === undefined) {
        // Click-to-select only.
        hitArea.addInputListener({
          down: () => {
            model.selectedToolProperty.value = tool;
          },
        });
      } else {
        // Drag a copy onto the grid; a plain click (no drop on a slot) just selects.
        let preview: Node | null = null;
        const { dragLayer, dropTarget } = dragContext;
        hitArea.addInputListener(
          new DragListener({
            start: (event) => {
              model.selectedToolProperty.value = tool;
              preview = makeToolNode(tool, BUTTON_SIZE);
              preview.opacity = 0.85;
              dragLayer.addChild(preview);
              preview.center = dragLayer.globalToLocalPoint(event.pointer.point);
            },
            drag: (event) => {
              if (preview !== null) {
                preview.center = dragLayer.globalToLocalPoint(event.pointer.point);
              }
            },
            end: (event) => {
              const slot =
                event === null ? null : dropTarget.slotIndexAt(event.pointer.point, model.qubitCountProperty.value);
              if (slot !== null) {
                model.placeCell(slot.qubit, slot.step);
              }
              if (preview !== null) {
                dragLayer.removeChild(preview);
                preview = null;
              }
            },
          }),
        );
      }
      this.addChild(hitArea);

      buttonEntries.push({ tool, highlight });
    }

    // Keep highlight in sync with the selected tool
    model.selectedToolProperty.link((activeTool) => {
      for (const entry of buttonEntries) {
        entry.highlight.visible = entry.tool === activeTool;
      }
    });
  }
}

/** Builds the visual for a tool at the given size, drawn from local (0,0). */
function makeToolNode(tool: SelectedTool, size: number): Node {
  const node = new Node();
  if (tool === "eraser") {
    node.addChild(new Rectangle(0, 0, size, size, { fill: QubitSketchColors.eraserColorProperty, cornerRadius: 6 }));
    node.addChild(
      new Text("✕", {
        font: `bold ${Math.floor(size * 0.44)}px sans-serif`,
        fill: "white",
        centerX: size / 2,
        centerY: size / 2,
      }),
    );
  } else if (tool === "control") {
    node.addChild(
      new Rectangle(0, 0, size, size, {
        fill: QubitSketchColors.slotBackgroundColorProperty,
        stroke: QubitSketchColors.slotBorderColorProperty,
        lineWidth: 1,
        cornerRadius: 6,
      }),
    );
    node.addChild(
      new Circle(8, { fill: QubitSketchColors.controlDotColorProperty, centerX: size / 2, centerY: size / 2 }),
    );
  } else {
    node.addChild(new GateNode(tool, size));
  }
  return node;
}
