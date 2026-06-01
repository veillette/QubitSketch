/**
 * ProbabilityBarsNode.ts
 *
 * One horizontal bar per computational basis state, its length proportional to
 * the measurement probability |amplitude|². The most intuitive readout of what
 * the circuit "does": place an H on q0 and the |0⟩/|1⟩ bars split 50/50.
 */
import type { ReadOnlyProperty } from "scenerystack/axon";
import { Node, Rectangle, Text } from "scenerystack/scenery";
import QubitSketchColors from "../../QubitSketchColors.js";
import { ketLabel } from "./displayUtils.js";

const ROW_HEIGHT = 16;
const LABEL_WIDTH = 52;
const PERCENT_WIDTH = 44;

export class ProbabilityBarsNode extends Node {
  public constructor(probabilitiesProperty: ReadOnlyProperty<number[]>, width: number) {
    super();

    const trackLeft = LABEL_WIDTH;
    const trackWidth = width - LABEL_WIDTH - PERCENT_WIDTH;

    probabilitiesProperty.link((probabilities) => {
      this.removeAllChildren();
      const n = Math.round(Math.log2(probabilities.length));

      for (let i = 0; i < probabilities.length; i++) {
        const p = probabilities[i] ?? 0;
        const y = i * ROW_HEIGHT;

        const label = new Text(ketLabel(i, n), {
          font: "11px monospace",
          fill: QubitSketchColors.textColorProperty,
          right: LABEL_WIDTH - 6,
          centerY: y + ROW_HEIGHT / 2,
        });
        this.addChild(label);

        const track = new Rectangle(trackLeft, y + 2, trackWidth, ROW_HEIGHT - 4, {
          fill: QubitSketchColors.slotBackgroundColorProperty,
          cornerRadius: 2,
        });
        this.addChild(track);

        if (p > 1e-6) {
          const bar = new Rectangle(trackLeft, y + 2, Math.max(1, trackWidth * p), ROW_HEIGHT - 4, {
            fill: QubitSketchColors.probabilityBarColorProperty,
            cornerRadius: 2,
          });
          this.addChild(bar);
        }

        const percent = new Text(`${(p * 100).toFixed(0)}%`, {
          font: "11px monospace",
          fill: QubitSketchColors.textColorProperty,
          left: trackLeft + trackWidth + 6,
          centerY: y + ROW_HEIGHT / 2,
        });
        this.addChild(percent);
      }
    });
  }
}
