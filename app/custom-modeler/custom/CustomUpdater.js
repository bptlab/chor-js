import inherits from 'inherits';

import BpmnUpdater from 'bpmn-js/lib/features/modeling/BpmnUpdater';

import {
  resizeBands
} from '../util/BandUtil';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';


/**
 * A handler responsible for updating the custom element's businessObject
 * once changes on the diagram happen.
 */
export default function CustomUpdater(eventBus, bpmnFactory, connectionDocking, translate, elementRegistry, graphicsFactory) {

  BpmnUpdater.call(this, eventBus, bpmnFactory, connectionDocking, translate);

  function updateChoreographyActivities(e) {
    //TODO do some specific updating for choreography activities
  }

  function resizeChoreographyActivities(context, oldBounds, newBounds) {
    resizeBands(context.shape, oldBounds, newBounds);
    context.shape.bandShapes.forEach(bandShape => {
      graphicsFactory.update(
        'shape',
        bandShape,
        elementRegistry.getGraphics(bandShape)
      );
    });
  }

  this.executed([
    'shape.create',
    'shape.move',
    'shape.delete'
  ], ifChoreographyActivity(updateChoreographyActivities));

  this.reverted([
    'shape.create',
    'shape.move',
    'shape.delete'
  ], ifChoreographyActivity(updateChoreographyActivities));

  this.executed([
    'shape.resize'
  ], ifChoreographyActivity(event => {
    resizeChoreographyActivities(
      event.context,
      event.context.oldBounds,
      event.context.newBounds
    );
  }));

  this.reverted([
    'shape.resize'
  ], ifChoreographyActivity(event => {
    // switch oldBounds and newBounds when reverting
    resizeChoreographyActivities(
      event.context,
      event.context.newBounds,
      event.context.oldBounds
    );
  }));
}

inherits(CustomUpdater, BpmnUpdater);

CustomUpdater.$inject = [
  'eventBus',
  'bpmnFactory',
  'connectionDocking',
  'translate',
  'elementRegistry',
  'graphicsFactory'
];

CustomUpdater.prototype.updateParent = function(element, oldParent) {
  if (!is(element, 'bpmn:Participant')) {
    BpmnUpdater.prototype.updateParent.call(this, element, oldParent);
  }
};

CustomUpdater.prototype.updateSemanticParent = function(businessObject, newParent, visualParent) {
  if (!is(businessObject, 'bpmn:Participant')) {
    BpmnUpdater.prototype.updateSemanticParent.call(this, businessObject, newParent, visualParent);
  }
};

/////// helpers ///////////////////////////////////

function ifChoreographyActivity(fn) {
  return function(event) {
    var context = event.context,
        element = context.shape || context.connection;

    if (is(element, 'bpmn:ChoreographyActivity')) {
      fn(event);
    }
  };
}
