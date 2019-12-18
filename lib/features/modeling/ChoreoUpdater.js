import inherits from 'inherits';

import BpmnUpdater from 'bpmn-js/lib/features/modeling/BpmnUpdater';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';
import { assign, pick } from 'min-dash';

/**
 * Override of BpmnUpdater because that one crashes with choreographies when updating
 * the shape as well as semantic parents.
 * @constructor
 * @param {Injector} injector
 */
export default function ChoreoUpdater(injector) {
  injector.invoke(BpmnUpdater, this);

  function updateBandBounds(bandShape) {
    assign(bandShape.diBand.bounds, pick(bandShape, ['x', 'y', 'width', 'height']));
  }

  this.executed([
    'shape.move',
    'shape.resize'
  ], event => {
    let shape = event.context.shape;
    if (is(shape, 'bpmn:Participant')) {
      updateBandBounds(shape);
    }
  });

  this.reverted([
    'shape.move',
    'shape.resize'
  ], event => {
    let shape = event.context.shape;
    if (is(shape, 'bpmn:Participant')) {
      updateBandBounds(shape);
    }
  });
}

inherits(ChoreoUpdater, BpmnUpdater);

ChoreoUpdater.$inject = [
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