import inherits from 'inherits';

import BpmnUpdater from 'bpmn-js/lib/features/modeling/BpmnUpdater';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

/**
 * Override of BpmnUpdater because that one crashes with choreographies when updating
 * the shape as well as semantic parents.
 */
export default function ChoreoUpdater(injector) {
  injector.invoke(BpmnUpdater, this);
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