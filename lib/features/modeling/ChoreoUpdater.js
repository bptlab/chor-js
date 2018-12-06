import inherits from 'inherits';

import BpmnUpdater from 'bpmn-js/lib/features/modeling/BpmnUpdater';

import {
  resizeBands
} from '../../util/BandUtil';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';


/**
 * A handler responsible for updating the choreography shapes and business objects.
 */
export default function ChoreoUpdater(
    eventBus, elementRegistry, injector) {

  injector.invoke(BpmnUpdater, this);

  function updateChoreographyActivities(e) {
    //TODO do some specific updating for choreography activities
  }

  function resizeChoreographyActivity(context, oldBounds, newBounds) {
    resizeBands(context.shape, oldBounds, newBounds);
    // fire a shape.changed event for each band so they get properly updated
    context.shape.bandShapes.forEach(bandShape => {
      eventBus.fire('element.changed', {
        element: bandShape
      });
      bandShape.children.forEach(message => {
        eventBus.fire('element.changed', {
          element: message
        });
      });
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
    resizeChoreographyActivity(
      event.context,
      event.context.oldBounds,
      event.context.newBounds
    );
  }));

  this.reverted([
    'shape.resize'
  ], ifChoreographyActivity(event => {
    // switch oldBounds and newBounds when reverting
    resizeChoreographyActivity(
      event.context,
      event.context.newBounds,
      event.context.oldBounds
    );
  }));
}

inherits(ChoreoUpdater, BpmnUpdater);

ChoreoUpdater.$inject = [
  'eventBus',
  'elementRegistry',
  'injector'
];

ChoreoUpdater.prototype.updateParent = function(element, oldParent) {
  if (!is(element, 'bpmn:Participant') && !is(element, 'bpmn:Message')) {
    BpmnUpdater.prototype.updateParent.call(this, element, oldParent);
  }
};

ChoreoUpdater.prototype.updateSemanticParent = function(businessObject, newParent, visualParent) {
  if (!is(businessObject, 'bpmn:Participant') && !is(businessObject, 'bpmn:Message')) {
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
