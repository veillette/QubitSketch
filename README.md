# QubitSketch

A drag-and-drop quantum circuit builder **with a live state simulator**, built with
[SceneryStack](https://scenerystack.org/). Place quantum gates on qubit wires and watch the
quantum state update in real time — probabilities, amplitudes, Bloch spheres, and sampled
measurements. Inspired by [Quirk](https://github.com/Strilanc/Quirk), reimplemented
idiomatically in SceneryStack for teaching.

## What it does

- **Build circuits** by dragging gates (H, X, Y, Z, S, T) from the palette onto the grid,
  or by selecting a tool and clicking a slot.
- **Controls & CNOT**: drop a control dot (•) in a column to make the gate in that column
  controlled. Two control dots make a Toffoli (CCX). This is how you create **entanglement**.
- **Live simulation** (CPU statevector, ≤ 5 qubits) recomputes on every edit and drives four
  displays:
  - **Probabilities** — measurement probability `|amplitude|²` per basis state.
  - **Amplitudes** — the complex amplitude, magnitude, and phase per basis state.
  - **Bloch spheres** — each qubit's reduced state as a 2D-projected arrow. Under
    entanglement the arrow shrinks toward the center (the reduced state is mixed).
  - **Measurement** — a *Measure* button samples one outcome from the distribution and
    tallies a histogram; with many shots it approaches the probability bars.

### Try this: a Bell state

Drag **H** onto q0, a **control** onto q0 in the next column, and **X** onto q1 in that same
column. The probabilities collapse to 50% `|00⟩` and 50% `|11⟩`, and both Bloch arrows
shrink to dots — the two qubits are entangled.

## Conventions

- **Endianness**: qubit 0 is the *least-significant* bit. Basis index `i` has qubit `q` set
  iff `(i >> q) & 1`. Kets are displayed big-endian, `|q_{n-1} … q_1 q_0⟩`.

## Limitations (vs Quirk)

This is a teaching tool focused on the core of quantum computing (superposition, phase,
interference, entanglement, measurement). It deliberately omits Quirk's advanced machinery:

- **CPU statevector only**, capped at **5 qubits** (32 amplitudes). No WebGL/GPU engine.
- **No arithmetic / modular / increment / QFT / Grover / phase-estimation gates.**
- **No parametrized or time-animated gates** (no rotation sliders, no `X^t`).
- **No density-matrix display.** A qubit's mixedness is conveyed only by its shortened Bloch
  arrow.
- **No true 3D Bloch sphere** — a 2D oblique projection is used (Quirk renders a rotatable
  3D sphere).
- **No custom/composite-gate editor** ("forge"), no gate grouping, no circuit import/export.
- **Controls act only within their own column**, and there is **one target gate per column**
  when controls are present. Multiple control dots in a column *do* work (Toffoli/CCX).
- **No anti-controls** (control-on-`|0⟩`) and **no SWAP/iSWAP**.
- **Measurement does not collapse the circuit.** The *Measure* button samples the final
  statevector for the histogram only; there is no mid-circuit measurement affecting later
  columns.

## Architecture

```
src/circuit-screen/
  model/
    GateType.ts          discriminated-union CircuitCell, gate/tool types, endianness note
    GateMatrices.ts      2×2 complex matrices for H,X,Y,Z,S,T (scenerystack/dot Complex)
    QuantumSimulator.ts  statevector engine: applyControlledGate, applyColumn, simulate,
                         computeBlochVectors
    QubitSketchModel.ts  circuit state + DerivedProperty chain (state → probs/bloch)
  view/
    CircuitCanvas.ts     grid, control dots + connectors, click-to-place, slotIndexAt
    GatePalettePanel.ts  palette + drag-to-place (DragListener)
    SimulationPanel.ts   hosts the four display nodes (sun.Panel)
    ProbabilityBarsNode.ts  AmplitudeTableNode.ts  BlochSpheresNode.ts
    MeasurementHistogramNode.ts  displayUtils.ts
```

The simulator is pure (no SceneryStack `Node`/`Property` deps); the model exposes
`stateVectorProperty`, `probabilitiesProperty`, and `blochVectorsProperty` as chained
`DerivedProperty`s so each display links only to the slice it needs and updates automatically.

## Common commands

```bash
npm start          # dev server (http://localhost:5173)
npm run build      # type-check + production build
npm run fix        # biome auto-fix (format + lint)
npm run check      # tsc type check only
```
