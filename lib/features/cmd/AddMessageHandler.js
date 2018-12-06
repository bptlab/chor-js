import {
  isUndefined
} from 'min-dash';

import {
  createMessageShape,
  createMessageSemantics,
  unlinkMessageSemantics,
  getMessageFlow,
  linkMessageSemantics
} from '../../util/MessageUtil';

export default function AddMessageHandler(injector, eventBus, canvas) {
  this._injector = injector;
  this._eventBus = eventBus;
  this._canvas = canvas;
}

AddMessageHandler.$inject = [
  'injector',
  'eventBus',
  'canvas'
];

AddMessageHandler.prototype.execute = function(context) {
  let bandShape = context.bandShape;
  let messageShape = context.messageShape;
  let task = bandShape.parent.businessObject;
  let participant = bandShape.bpmnElement;

  // create message semantics and shape if necessary (might be a redo)
  if (isUndefined(messageShape)) {
    let message = createMessageSemantics(
      this._injector,
      task,
      participant
    );
    linkMessageSemantics(this._injector, task, getMessageFlow(task, message), context.oldIndices);
    messageShape = createMessageShape(this._injector, bandShape, message);
    context.messageShape = messageShape;
  }

  // link shape and add to canvas
  bandShape.attachedMessageShape = messageShape;
  this._canvas.addShape(messageShape, bandShape);
  bandShape.diBand.isMessageVisible = true;

  // redraw the band just in case and to update the selection
  this._eventBus.fire('element.changed', {
    element: bandShape
  });
};

AddMessageHandler.prototype.revert = function(context) {
  let bandShape = context.bandShape;
  let messageShape = context.messageShape;
  let message = messageShape.businessObject;
  let task = bandShape.parent.businessObject;

  delete bandShape.attachedMessageShape;
  this._canvas.removeShape(messageShape);
  context.oldIndices = unlinkMessageSemantics(this._injector, task, getMessageFlow(task, message));
};