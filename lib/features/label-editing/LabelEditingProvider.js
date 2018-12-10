import {
  assign,
  pick
} from 'min-dash';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

export default function LabelEditingProvider(directEditing, modeling, canvas) {
  directEditing.registerProvider(this);
  this._modeling = modeling;
  this._canvas = canvas;
}

LabelEditingProvider.$inject = [
  'directEditing',
  'modeling',
  'canvas'
];

LabelEditingProvider.prototype.activate = function(element) {
  if (is(element, 'bpmn:Message')) {
    let context = {};

    context.text = element.businessObject.name || '';
    let messageBounds = this._canvas.getAbsoluteBBox(element);
    let bandBounds = this._canvas.getAbsoluteBBox(element.parent);
    context.bounds = assign(
      pick(messageBounds, ['y', 'height']),
      pick(bandBounds, ['x', 'width'])
    );

    return context;
  }
};

LabelEditingProvider.prototype.update = function(
    element, newLabel, activeContextText, bounds) {
  if (!newLabel || !newLabel.trim()) {
    newLabel = null;
  }
  this._modeling.updateLabel(element, newLabel);
};