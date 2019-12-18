import inherits from 'inherits';

import {
  is, getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import BpmnElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';

/**
 * A factory that knows how to create choreography-related business objects.
 * It also provides default sizes and other information.
 * @constructor
 * @param {Injector} injector
 * @param {Moddle} moddle
 */
export default function ChoreoElementFactory(injector, moddle) {
  injector.invoke(BpmnElementFactory, this);
  this._moddle = moddle;

}

inherits(ChoreoElementFactory, BpmnElementFactory);

ChoreoElementFactory.$inject = [
  'injector',
  'moddle'
];

/**
 * @param {Object} element BPMN model or shape object
 *
 * @return {Dimensions} A {width, height} object representing the size of the element
 */
ChoreoElementFactory.prototype._getDefaultSize = function(element) {
  let businessObject = getBusinessObject(element);
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

ChoreoElementFactory.prototype.createBpmnElement = function(elementType, attrs) {
  const shape = BpmnElementFactory.prototype.createBpmnElement.call(this, elementType, attrs);
  if (is(shape.businessObject, 'bpmn:Participant') && shape.oldBusinessObject) {
    // We need to update the Participant Band's id, because the assumption by bpmn.js that
    // bussinessObject.id == shape.id is not true for participant bands.
    shape.id = this._moddle.ids.nextPrefixed('ParticipantBand_', shape.businessObject);
  }
  return shape;
};