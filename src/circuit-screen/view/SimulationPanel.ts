/**
 * SimulationPanel.ts
 *
 * The live-simulation readout shown to the right of the circuit. It hosts the
 * state displays, each driven by a DerivedProperty on the model so they update
 * automatically whenever the circuit changes. Nothing here computes physics —
 * that all lives in QuantumSimulator.ts.
 */
import { Node, Text, VBox } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import QubitSketchColors from "../../QubitSketchColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ReadOnlyProperty } from "scenerystack/axon";
import type { QubitSketchModel } from "../model/QubitSketchModel.js";
import { ProbabilityBarsNode } from "./ProbabilityBarsNode.js";

export const SIM_PANEL_CONTENT_WIDTH = 300;

export class SimulationPanel extends Panel {
  public constructor(model: QubitSketchModel) {
    const strings = StringManager.getInstance();
    const titles = strings.getDisplayTitles();

    const content = new VBox({
      align: "left",
      spacing: 14,
      children: [
        section(titles.probabilitiesStringProperty, new ProbabilityBarsNode(model.probabilitiesProperty, SIM_PANEL_CONTENT_WIDTH)),
      ],
    });

    super(content, {
      fill: QubitSketchColors.panelBackgroundColorProperty,
      stroke: QubitSketchColors.panelBorderColorProperty,
      cornerRadius: 8,
      xMargin: 12,
      yMargin: 12,
    });
  }
}

/** Wraps a display node with a bold section title above it. */
function section(titleProperty: ReadOnlyProperty<string>, body: Node): Node {
  return new VBox({
    align: "left",
    spacing: 4,
    children: [
      new Text(titleProperty, {
        font: "bold 14px sans-serif",
        fill: QubitSketchColors.textColorProperty,
      }),
      body,
    ],
  });
}
