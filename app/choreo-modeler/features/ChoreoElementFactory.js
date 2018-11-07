import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import BpmnElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';

/**
 * A custom factory that knows how to create choreography elements.
 */
export default function CustomElementFactory(injector) {
  injector.invoke(BpmnElementFactory, this);
}

inherits(CustomElementFactory, BpmnElementFactory);

CustomElementFactory.$inject = [
  'injector'
];

/**
 * @param {Object} businessObject BPMN model object
 *
 * @return {Dimensions} a {width, height} object representing the size of the element
 */
CustomElementFactory.prototype._getDefaultSize = function(businessObject) {
  if (is(businessObject, 'bpmn:ChoreographyTask')) {
    return {
      width: 100,
      height: 100
    };
  } else {
    return BpmnElementFactory.prototype._getDefaultSize.call(this, businessObject);
  }
};
