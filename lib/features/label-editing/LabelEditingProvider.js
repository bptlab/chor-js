import {
  assign,
  pick
} from 'min-dash';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

export default function LabelEditingProvider(directEditing, modeling) {
  directEditing.registerProvider(this);
  this._modeling = modeling;
}

LabelEditingProvider.$inject = [
  'directEditing',
  'modeling'
];

LabelEditingProvider.prototype.activate = function(element) {
  if (is(element, 'bpmn:Message')) {
    let context = {};

    context.text = element.businessObject.name || '';
    context.bounds = assign(
      pick(element, ['y', 'height']),
      pick(element.parent, ['x', 'width'])
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