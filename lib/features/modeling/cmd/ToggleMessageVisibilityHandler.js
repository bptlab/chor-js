import {
  assign
} from 'min-dash';

import {
  getAttachedMessageBounds
} from '../../../util/MessageUtil';

/**
 * Command handler that fires on `message.toggle`.
 *
 * Basically toggles the visibility of the message on the canvas.
 *
 * The context contains the band shape with the message that should be toggled
 * attached.
 */
export default function ToggleMessageVisibilityHandler(eventBus, canvas) {
  this._eventBus = eventBus;
  this._canvas = canvas;
}

ToggleMessageVisibilityHandler.$inject = [
  'eventBus',
  'canvas',
];

ToggleMessageVisibilityHandler.prototype.toggle = function(context) {
  let bandShape = context.bandShape;
  let messageShape = bandShape.attachedMessageShape;
  let visible = bandShape.diBand.isMessageVisible;

  // toggle the visibility in the DI element of the associated band
  bandShape.diBand.isMessageVisible = !visible;

  if (visible) {
    // hide the message
    this._canvas.removeShape(messageShape);
  } else {
    // show the message
    assign(messageShape, getAttachedMessageBounds(bandShape));
    this._canvas.addShape(messageShape, bandShape);
  }

  // redraw the band just in case and to update the selection
  this._eventBus.fire('element.changed', {
    element: bandShape
  });
};

ToggleMessageVisibilityHandler.prototype.execute = function(context) {
  this.toggle(context);
};

ToggleMessageVisibilityHandler.prototype.revert = function(context) {
  this.toggle(context);
};