import { getMessageShape } from '../../../util/MessageUtil';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Command handler that fires on `message.toggle`.
 *
 * Basically toggles the visibility of the message on the canvas.
 *
 * The context contains the band shape with the message that should be toggled.
 * @constructor
 * @param {Selection} selection
 */
export default function ToggleMessageVisibilityHandler(selection) {
  this._selection = selection;
}

ToggleMessageVisibilityHandler.$inject = [
  'selection',
];

ToggleMessageVisibilityHandler.prototype.toggle = function(context) {
  let bandShape = context.bandShape;
  let messageShape = getMessageShape(bandShape);
  let visible = bandShape.diBand.isMessageVisible;

  // toggle the visibility of the relevant elements
  bandShape.diBand.isMessageVisible = !visible;
  messageShape.hidden = visible;

  // update the selection
  this._selection.deselect(messageShape);

  // return both shapes as dirty so they get redrawn
  return [messageShape, bandShape];
};

ToggleMessageVisibilityHandler.prototype.preExecute = function(context) {
  let element = context.element;

  if (is(element, 'bpmn:Message')) {
    context.bandShape = element.parent;
  } else if (is(element, 'bpmn:Participant')) {
    context.bandShape = element;
  }
};

ToggleMessageVisibilityHandler.prototype.execute = function(context) {
  return this.toggle(context);
};

ToggleMessageVisibilityHandler.prototype.revert = function(context) {
  return this.toggle(context);
};