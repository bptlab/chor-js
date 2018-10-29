import {
  assign
} from 'min-dash';

import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import BpmnElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import {
  DEFAULT_LABEL_SIZE
} from 'bpmn-js/lib/util/LabelUtil';


/**
 * A custom factory that knows how to create choreography elements.
 */
export default function CustomElementFactory(bpmnFactory, moddle) {
  BpmnElementFactory.call(this, bpmnFactory, moddle);

  var self = this;

  /**
   * Create a diagram-js element with the given type (any of shape, connection, label).
   *
   * @param  {String} elementType
   * @param  {Object} attrs
   *
   * @return {djs.model.Base}
   */
  this.create = function(elementType, attrs) {
    if (elementType === 'label') {
      return self.baseCreate(elementType, assign({ type: 'label' }, DEFAULT_LABEL_SIZE, attrs));
    }
    return self.createBpmnElement(elementType, attrs);
  };
}

inherits(CustomElementFactory, BpmnElementFactory);

CustomElementFactory.$inject = [
  'bpmnFactory',
  'moddle'
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
