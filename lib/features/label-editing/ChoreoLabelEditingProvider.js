import inherits from 'inherits';
import LabelEditingProvider from 'bpmn-js/lib/features/label-editing/LabelEditingProvider';
import {
  assign,
  pick
} from 'min-dash';
import {
  is
} from 'bpmn-js/lib/util/ModelUtil';
import {
  heightOfBottomBands,
  heightOfTopBands
} from '../../util/BandUtil';

export default function ChoreoLabelEditingProvider(eventBus, canvas, directEditing,
    modeling, resizeHandles, textRenderer) {
  LabelEditingProvider.call(this, eventBus, canvas, directEditing,
    modeling, resizeHandles, textRenderer);
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
    const context = LabelEditingProvider.prototype.activate.call(this, element);
    if (is(element, 'bpmn:ChoreographyActivity')) {
      assign(context.options, {
        centerVertically: true
      });
    }
    return context;
  }
};

ChoreoLabelEditingProvider.prototype.getEditingBBox = function(element) {
  const boundsAndStyle = LabelEditingProvider.prototype.getEditingBBox.call(this, element);

  if (is(element, 'bpmn:ChoreographyActivity')) {
    const elementBounds = this._canvas.getAbsoluteBBox(element);
    const maxHeight = elementBounds.height - heightOfTopBands(element) - heightOfBottomBands(element);
    let height = maxHeight;
    if (
      (element.businessObject.loopType !== 'None' || !element.businessObject.loopType) ||
      is(element, 'bpmn:CallChoreography') ||
      (is(element, 'bpmn:SubChoreography') && element.collapsed)) {
      height -= 21; // leave space for the marker to be shown
    }
    if (is(element, 'bpmn:SubChoreography') && !element.collapsed) {
      height = maxHeight < 20? maxHeight: 20; // Reduce height to one line
    }
    const activityBounds = {
      x: elementBounds.x,
      y: elementBounds.y + heightOfTopBands(element),
      width: elementBounds.width,
      height: height
    };
    boundsAndStyle.bounds = activityBounds;
  }
  return boundsAndStyle;
};
