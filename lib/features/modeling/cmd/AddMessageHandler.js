import {
  isUndefined
} from 'min-dash';

import {
  createMessageShape,
  createMessageFlowSemantics,
  linkMessageFlowSemantics,
  unlinkMessageFlowSemantics
} from '../../../util/MessageUtil';

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
  let messageFlow = context.messageFlow;

  let task = bandShape.parent.businessObject;
  let participant = bandShape.bpmnElement;

  // create message semantics and shape if necessary (might be a redo)
  if (isUndefined(messageShape)) {
    messageFlow = createMessageFlowSemantics(
      this._injector,
      task,
      participant
    );
    messageShape = createMessageShape(this._injector, bandShape, messageFlow);
    context.messageShape = messageShape;
    context.messageFlow = messageFlow;
  }

  // link shape and add to canvas
  linkMessageFlowSemantics(this._injector, task, messageFlow);
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
  let messageFlow = context.messageFlow;

  let task = bandShape.parent.businessObject;

  delete bandShape.attachedMessageShape;
  this._canvas.removeShape(messageShape);
  context.oldIndices = unlinkMessageFlowSemantics(this._injector, task, messageFlow);
};