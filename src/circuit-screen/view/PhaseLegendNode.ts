/**
 * PhaseLegendNode.ts
 *
 * A compact horizontal key showing how phase angle (0 → 2π) maps to color, so the
 * phase-colored amplitude bars are legible. A continuous hue strip with a few tick
 * labels underneath.
 */
import { Node, Rectangle, Text } from "scenerystack/scenery";
import QubitSketchColors from "../../QubitSketchColors.js";
import { phaseAngleToColor } from "./displayUtils.js";

const STRIP_HEIGHT = 7;
const SEGMENTS = 48;
const LABEL_FONT = "8px sans-serif";

export class PhaseLegendNode extends Node {
  public constructor(width: number) {
    super({ pickable: false });

    // Continuous hue strip across one full turn of phase.
    const segWidth = width / SEGMENTS;
    for (let i = 0; i < SEGMENTS; i++) {
      const phase = (i / SEGMENTS) * 2 * Math.PI;
      this.addChild(
        new Rectangle(i * segWidth, 0, segWidth + 0.5, STRIP_HEIGHT, {
          fill: phaseAngleToColor(phase),
        }),
      );
    }

    // A few phase tick labels beneath the strip.
    const ticks: ReadonlyArray<readonly [string, number]> = [
      ["0", 0],
      ["π/2", 0.25],
      ["π", 0.5],
      ["3π/2", 0.75],
      ["2π", 1],
    ];
    for (const [label, frac] of ticks) {
      const text = new Text(label, { font: LABEL_FONT, fill: QubitSketchColors.textColorProperty });
      text.centerX = Math.min(width - text.width / 2, Math.max(text.width / 2, frac * width));
      text.top = STRIP_HEIGHT + 1;
      this.addChild(text);
    }
  }
}
