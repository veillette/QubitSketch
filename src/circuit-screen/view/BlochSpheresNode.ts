/**
 * BlochSpheresNode.ts
 *
 * A row of small Bloch spheres, one per qubit. Each shows that qubit's reduced
 * state as an arrow (2D projection): |0⟩ at the top, |1⟩ at the bottom, the X
 * axis across, and the Y axis projected diagonally for a sense of depth.
 *
 * When a qubit is entangled, its reduced state is mixed and the arrow shrinks
 * toward the center — a direct, visible cue that "this qubit alone no longer has
 * a definite state."
 *
 * This is a deliberately simple 2D projection, NOT a true 3D sphere (Quirk uses
 * a rotatable 3D rendering). See README limitations.
 */
import type { ReadOnlyProperty } from "scenerystack/axon";
import type { Vector3 } from "scenerystack/dot";
import { Circle, Line, Node, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import QubitSketchColors from "../../QubitSketchColors.js";

const MAX_R = 30;
const MIN_R = 12;
const TOP_LABEL_H = 14;
const H_PADDING = 12; // horizontal padding around each sphere
const SPACING = 8;

export class BlochSpheresNode extends Node {
  private readonly availableWidth: number;

  public constructor(
    blochVectorsProperty: ReadOnlyProperty<Vector3[]>,
    qubitCountProperty: ReadOnlyProperty<number>,
    width: number,
  ) {
    super();
    this.availableWidth = width;

    const rebuild = (vectors: Vector3[], count: number): void => {
      this.removeAllChildren();
      const r = this.radiusFor(count);
      const sphereW = 2 * r + 2 * H_PADDING;
      for (let q = 0; q < count; q++) {
        const sphere = this.makeSphere(q, vectors[q], r);
        sphere.x = q * (sphereW + SPACING);
        this.addChild(sphere);
      }
    };

    blochVectorsProperty.link((vectors) => rebuild(vectors, qubitCountProperty.value));
    qubitCountProperty.link((count) => rebuild(blochVectorsProperty.value, count));
  }

  /** Largest radius that lets `count` spheres fit the available width. */
  private radiusFor(count: number): number {
    const perSphere = this.availableWidth / count - SPACING;
    return Math.max(MIN_R, Math.min(MAX_R, perSphere / 2 - H_PADDING));
  }

  private makeSphere(qubit: number, v: Vector3 | undefined, r: number): Node {
    const node = new Node();
    const cx = r + H_PADDING;
    const cy = TOP_LABEL_H + r;

    // Oblique projection of a Bloch vector (x, y, z) into 2D (scenery y-down).
    const px = r * ((v?.x ?? 0) + 0.45 * (v?.y ?? 0));
    const py = r * (-(v?.z ?? 0) + 0.3 * (v?.y ?? 0));

    node.addChild(
      new Text(`q${qubit}`, {
        font: "bold 11px monospace",
        fill: QubitSketchColors.textColorProperty,
        centerX: cx,
        top: 0,
      }),
    );

    node.addChild(
      new Circle(r, {
        centerX: cx,
        centerY: cy,
        stroke: QubitSketchColors.blochSphereOutlineColorProperty,
        lineWidth: 1,
        fill: null,
      }),
    );
    node.addChild(
      new Line(cx - r, cy, cx + r, cy, { stroke: QubitSketchColors.blochSphereOutlineColorProperty, lineWidth: 0.5 }),
    );
    node.addChild(
      new Line(cx, cy - r, cx, cy + r, { stroke: QubitSketchColors.blochSphereOutlineColorProperty, lineWidth: 0.5 }),
    );

    if (v !== undefined && v.magnitude > 1e-3) {
      node.addChild(
        new ArrowNode(cx, cy, cx + px, cy + py, {
          fill: QubitSketchColors.blochArrowColorProperty,
          stroke: QubitSketchColors.blochArrowColorProperty,
          headWidth: 8,
          headHeight: 8,
          tailWidth: 2,
        }),
      );
    } else {
      // Mixed / zero-length reduced state: a small dot at the center.
      node.addChild(new Circle(2.5, { centerX: cx, centerY: cy, fill: QubitSketchColors.blochArrowColorProperty }));
    }

    return node;
  }
}
