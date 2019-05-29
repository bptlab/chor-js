import {
  assign,
  pick
} from 'min-dash';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';
import inherits from 'inherits';
import LabelEditingProvider from 'bpmn-js/lib/features/label-editing/LabelEditingProvider';
import { heightOfBottomBands, heightOfTopBands } from '../../util/BandUtil';

export default function ChoreoLabelEditingProvider(eventBus, canvas, directEditing,
    modeling, resizeHandles, textRenderer) {
  LabelEditingProvider.call(this, eventBus, canvas, directEditing,
    modeling, resizeHandles, textRenderer);
  //directEditing.registerProvider(this);
  this._modeling = modeling;
  this._canvas = canvas;
}

inherits(ChoreoLabelEditingProvider, LabelEditingProvider);


ChoreoLabelEditingProvider.$inject = [
  'eventBus',
  'canvas',
  'directEditing',
  'modeling',
  'resizeHandles',
  'textRenderer'
];

ChoreoLabelEditingProvider.prototype.activate = function(element) {
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
  } else {
    return LabelEditingProvider.prototype.activate.call(this, element);
  }
};

ChoreoLabelEditingProvider.prototype.getEditingBBox = function(element) {
  if (!is(element, 'bpmn:ChoreographyActivity')) {
    return LabelEditingProvider.prototype.getEditingBBox.call(this, element);
  } else {
    const elementBounds = this._canvas.getAbsoluteBBox(element);
    const bounds = {
      x: elementBounds.x,
      y: elementBounds.y + heightOfTopBands(element),
      width: elementBounds.width,
      height: elementBounds.height - heightOfTopBands(element) - heightOfBottomBands(element),
    };
    // Todo: There is usually also a style attributed part of the return value. I am not sure how important it is.
    return { bounds:bounds };
  }
};

// ChoreoLabelEditingProvider.prototype.update = function(
//     element, newLabel, activeContextText, bounds) {
//   if (!newLabel || !newLabel.trim()) {
//     newLabel = null;
//   }
//   this._modeling.updateLabel(element, newLabel);
// };