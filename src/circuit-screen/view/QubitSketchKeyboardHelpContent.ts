/**
 * QubitSketchKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * Composed from the standard scenery-phet help sections: a slider section, a
 * combo-box section for the selectors, and the basic-actions section for tab
 * navigation and buttons.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class QubitSketchKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const leftSections = [new SliderControlsKeyboardHelpSection(), new ComboBoxKeyboardHelpSection()];
    const rightSections = [new BasicActionsKeyboardHelpSection()];
    super(leftSections, rightSections);
  }
}
