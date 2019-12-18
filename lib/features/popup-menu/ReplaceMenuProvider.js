import inherits from 'inherits';
import BaseReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider';
import { isDifferentType } from 'bpmn-js/lib/features/popup-menu/util/TypeUtil';
import { is } from 'bpmn-js/lib/util/ModelUtil';

import * as replaceOptions from 'bpmn-js/lib/features/replace/ReplaceOptions';

/**
 * @param {Injector} injector
 * @constructor
 */
export default function ReplaceMenuProvider(injector) {
  injector.invoke(BaseReplaceMenuProvider, this);
}

inherits(ReplaceMenuProvider, BaseReplaceMenuProvider);

ReplaceMenuProvider.$inject = [
  'injector'
];

ReplaceMenuProvider.prototype.register = function() {
  this._popupMenu.registerProvider('chor-replace', this);
};

ReplaceMenuProvider.prototype.getEntries = function(element) {
  let businessObject = element.businessObject;
  let entries;

  if (!this._rules.allowed('shape.replace', { element: element })) {
    return [];
  }

  var differentType = isDifferentType(element);

  // start events
  if (is(businessObject, 'bpmn:StartEvent')) {
    entries = replaceOptions.START_EVENT.filter(differentType).filter(isInTargets([
      {
        type: 'bpmn:StartEvent'
      }, {
        type: 'bpmn:IntermediateThrowEvent'
      }, {
        type: 'bpmn:EndEvent'
      }, {
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:TimerEventDefinition'
      }, {
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:ConditionalEventDefinition'
      }, {
        type: 'bpmn:StartEvent',
        eventDefinitionType: 'bpmn:SignalEventDefinition'
      }
    ]));
    return this._createEntries(element, entries);
  }

  // end events
  if (is(businessObject, 'bpmn:EndEvent')) {
    entries = replaceOptions.END_EVENT.filter(differentType).filter(isInTargets([
      {
        type: 'bpmn:StartEvent'
      }, {
        type: 'bpmn:IntermediateThrowEvent'
      }, {
        type: 'bpmn:EndEvent'
      }, {
        type: 'bpmn:EndEvent',
        eventDefinitionType: 'bpmn:TerminateEventDefinition'
      }
    ]));
    return this._createEntries(element, entries);
  }

  // boundary events
  if (is(businessObject, 'bpmn:BoundaryEvent')) {
    entries = replaceOptions.BOUNDARY_EVENT.filter(differentType).filter(isInTargets([
      {
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:TimerEventDefinition'
      }, {
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:ConditionalEventDefinition'
      }, {
        type: 'bpmn:BoundaryEvent',
        eventDefinitionType: 'bpmn:SignalEventDefinition'
      }
    ]));
    return this._createEntries(element, entries);
  }

  // intermediate events
  if (is(businessObject, 'bpmn:IntermediateCatchEvent') ||
      is(businessObject, 'bpmn:IntermediateThrowEvent')) {
    entries = replaceOptions.INTERMEDIATE_EVENT.filter(differentType).filter(isInTargets([
      {
        type: 'bpmn:StartEvent'
      }, {
        type: 'bpmn:IntermediateThrowEvent'
      }, {
        type: 'bpmn:EndEvent'
      }, {
        type: 'bpmn:IntermediateCatchEvent',
        eventDefinitionType: 'bpmn:TimerEventDefinition'
      }, {
        type: 'bpmn:IntermediateCatchEvent',
        eventDefinitionType: 'bpmn:ConditionalEventDefinition'
      }, {
        type: 'bpmn:IntermediateCatchEvent',
        eventDefinitionType: 'bpmn:SignalEventDefinition'
      }
    ]));
    return this._createEntries(element, entries);
  }

  // gateways
  if (is(businessObject, 'bpmn:Gateway')) {
    entries = replaceOptions.GATEWAY.filter(differentType);
    return this._createEntries(element, entries);
  }

  // sequence flows
  if (is(businessObject, 'bpmn:SequenceFlow')) {
    return this._createSequenceFlowEntries(element, replaceOptions.SEQUENCE_FLOW);
  }

  return [];
};

function isInTargets(targets) {
  return function(element) {
    return targets.some(
      target => element.target.type == target.type &&
      element.target.eventDefinitionType == target.eventDefinitionType
    );
  };
}