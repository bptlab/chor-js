import {
  assign,
  pick
} from 'min-dash';

export default function ChoreoLabelEditingProvider(
    eventBus, canvas, directEditing, modeling, resizeHandles, textRenderer) {
  directEditing.registerProvider(this);
  this._modeling = modeling;
}

ChoreoLabelEditingProvider.$inject = [
  'eventBus',
  'canvas',
  'directEditing',
  'modeling',
  'resizeHandles',
  'textRenderer'
];

ChoreoLabelEditingProvider.prototype.activate = function(element) {
  let context = {};

  context.text = element.businessObject.name || '';
  context.bounds = assign(
    pick(element, ['y', 'height']),
    pick(element.parent, ['x', 'width'])
  );

  return context;
};

ChoreoLabelEditingProvider.prototype.update = function(
    element, newLabel, activeContextText, bounds) {
  if (!newLabel || !newLabel.trim()) {
    newLabel = null;
  }
  this._modeling.updateLabel(element, newLabel);
};