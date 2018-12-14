import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import BpmnElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';

/**
 * A factory that knows how to create choreography-related business objects.
 * It also provides default sizes and other information.
 */
export default function ChoreoElementFactory(injector) {
  injector.invoke(BpmnElementFactory, this);
}

inherits(ChoreoElementFactory, BpmnElementFactory);

ChoreoElementFactory.$inject = [
  'injector'
];

/**
 * @param {Object} businessObject BPMN model object
 *
 * @return {Dimensions} A {width, height} object representing the size of the element
 */
ChoreoElementFactory.prototype._getDefaultSize = function(businessObject) {
  if (is(businessObject, 'bpmn:ChoreographyTask')) {
    return {
      width: 100,
      height: 80
    };
  } else if (is(businessObject, 'bpmn:SubChoreography') || is(businessObject, 'bpmn:CallChoreography')) {
    if (businessObject.di.isExpanded) {
      return {
        width: 300,
        height: 200
      };
    } else {
      return {
        width: 120,
        height: 120
      };
    }
  } else {
    return BpmnElementFactory.prototype._getDefaultSize.call(this, businessObject);
  }
};
