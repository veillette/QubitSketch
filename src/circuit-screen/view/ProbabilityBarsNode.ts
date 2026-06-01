/**
 * ProbabilityBarsNode.ts
 *
 * One horizontal bar per computational basis state, its length proportional to
 * the measurement probability |amplitude|². The most intuitive readout of what
 * the circuit "does": place an H on q0 and the |0⟩/|1⟩ bars split 50/50.
 *
 * Row height auto-scales to a fixed box so the panel never overflows the screen,
 * however many qubits are active.
 */
import type { ReadOnlyProperty } from "scenerystack/axon";
import { Node, Rectangle, Text } from "scenerystack/scenery";
import QubitSketchColors from "../../QubitSketchColors.js";
import { ketLabel } from "./displayUtils.js";

const MAX_ROW_HEIGHT = 16;
const LABEL_WIDTH = 52;
const PERCENT_WIDTH = 44;

export class ProbabilityBarsNode extends Node {
  public constructor(probabilitiesProperty: ReadOnlyProperty<number[]>, width: number, boxHeight: number) {
    super();

    const trackLeft = LABEL_WIDTH;
    const trackWidth = width - LABEL_WIDTH - PERCENT_WIDTH;

    probabilitiesProperty.link((probabilities) => {
      this.removeAllChildren();
      const n = Math.round(Math.log2(probabilities.length));
      const rowHeight = Math.min(MAX_ROW_HEIGHT, boxHeight / probabilities.length);
      const fontSize = Math.max(7, Math.min(11, rowHeight - 3));
      const font = `${fontSize}px monospace`;

      for (let i = 0; i < probabilities.length; i++) {
        const p = probabilities[i] ?? 0;
        const y = i * rowHeight;

        this.addChild(
          new Text(ketLabel(i, n), {
            font,
            fill: QubitSketchColors.textColorProperty,
            right: LABEL_WIDTH - 6,
            centerY: y + rowHeight / 2,
          }),
        );
        this.addChild(
          new Rectangle(trackLeft, y + 1, trackWidth, rowHeight - 2, {
            fill: QubitSketchColors.slotBackgroundColorProperty,
            cornerRadius: 2,
          }),
        );
        if (p > 1e-6) {
          this.addChild(
            new Rectangle(trackLeft, y + 1, Math.max(1, trackWidth * p), rowHeight - 2, {
              fill: QubitSketchColors.probabilityBarColorProperty,
              cornerRadius: 2,
            }),
          );
        }
        this.addChild(
          new Text(`${(p * 100).toFixed(0)}%`, {
            font,
            fill: QubitSketchColors.textColorProperty,
            left: trackLeft + trackWidth + 6,
            centerY: y + rowHeight / 2,
          }),
        );
      }
    });
  }
}
