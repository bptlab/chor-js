import inherits from 'inherits';

import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  assign,
  isArray
} from 'min-dash';

/**
 * Provider responsible for populating the context pad menu of all elements.
 * This menu appears whenever a user selects a shape in the modeler and can be
 * used to append new elements or configure some properties.
 */
export default function ChoreoContextPadProvider(injector) {
  injector.invoke(ContextPadProvider, this);
}

inherits(ChoreoContextPadProvider, ContextPadProvider);

ChoreoContextPadProvider.$inject = [
  'injector'
];

/**
 * @param {Object} element Shape the user selected
 *
 * @return {Object} Context pad entries for the selected shape
 */
ChoreoContextPadProvider.prototype.getContextPadEntries = function(element) {
  var actions = {};

  if (element.type === 'label') {
    return actions;
  }

  var businessObject = element.businessObject;
  var self = this;

  // define a few local functions that are reused later
  function startConnect(event, element, autoActivate) {
    self._connect.start(event, element, autoActivate);
  }

  function removeElement(e) {
    self._modeling.removeElements([ element ]);
  }

  function appendAction(type, className, title, options) {
    if (typeof title !== 'string') {
      options = title;
      title = self._translate('Append {type}', { type: type.replace(/^bpmn:/, '') });
    }

    function appendStart(event, element) {
      var shape = self._elementFactory.createShape(assign({ type: type }, options));
      self._create.start(event, shape, element);
    }

    var append = self._autoPlace ? function(event, element) {
      var shape = self._elementFactory.createShape(assign({ type: type }, options));
      self._autoPlace.append(element, shape);
    } : appendStart;

    return {
      group: 'append',
      className: className,
      title: title,
      action: {
        dragstart: appendStart,
        click: append
      }
    };
  }

  // context pad for participant bands
  if (is(businessObject, 'bpmn:Participant')) {
    // move the band up/down depending on its position
    let bandShapes = element.activityShape.bandShapes;
    let bandCount = bandShapes.length;
    let bandIndex = bandShapes.findIndex(shape => shape === element);

    if (bandIndex > 0) {
      // move up
      assign(actions, {
        'move-upwards': {
          group: 'move',
          className: 'choreo-icon-up',
          title: this._translate('Move upwards'),
          action: {
            click: () => self._modeling.moveParticipantBand(element.activityShape, element, true)
          }
        }
      });
    }
    if (bandIndex < bandCount - 1) {
      // move down
      assign(actions, {
        'move-downwards': {
          group: 'move',
          className: 'choreo-icon-down',
          title: this._translate('Move downwards'),
          action: {
            click: () => self._modeling.moveParticipantBand(element.activityShape, element, false)
          }
        }
      });
    }
  }

  // generate the actual context pad entries based on the element type
  if (is(businessObject, 'bpmn:FlowNode')) {
    // all elements except for end events can connect to at least choreography tasks
    if (!is(businessObject, 'bpmn:EndEvent')) {
      assign(actions, {
        'append.choreography-task': appendAction(
          'bpmn:ChoreographyTask',
          'choreo-icon-choreography-task'
        ),
        'connect': {
          group: 'edit',
          className: 'bpmn-icon-connection',
          title: this._translate('Connect using Sequence Flow'),
          action: {
            click: startConnect,
            dragstart: startConnect
          }
        }
      });
    }

    // event-based gateways can connect to intermediate events
    if (is(businessObject, 'bpmn:EventBasedGateway')) {
      assign(actions, {
        'append.timer-intermediate-event': appendAction(
          'bpmn:IntermediateCatchEvent',
          'bpmn-icon-intermediate-event-catch-timer',
          this._translate('Append TimerIntermediateCatchEvent'),
          { eventDefinitionType: 'bpmn:TimerEventDefinition' }
        )
      });
    }

    // all elements except event-based gateways and end events can connect to a common
    // set of further elements
    if (!is(businessObject, 'bpmn:EventBasedGateway') && !is(businessObject, 'bpmn:EndEvent')) {
      assign(actions, {
        'append.choreography-task': appendAction(
          'bpmn:ChoreographyTask',
          'choreo-icon-choreography-task'
        ),
        'append.end-event': appendAction(
          'bpmn:EndEvent',
          'bpmn-icon-end-event-none'
        ),
        'append.gateway-parallel': appendAction(
          'bpmn:ParallelGateway',
          'bpmn-icon-gateway-parallel',
          this._translate('Append ParallelGateway')
        ),
        'append.gateway-event': appendAction(
          'bpmn:EventBasedGateway',
          'bpmn-icon-gateway-eventbased',
          this._translate('Append EventBasedGateway')
        ),
        'append.gateway-xor': appendAction(
          'bpmn:ExclusiveGateway',
          'bpmn-icon-gateway-xor',
          this._translate('Append ExclusiveGateway')
        )
      });
    }
  }

  // flow nodes can be annotated
  if (is(businessObject, 'bpmn:FlowNode')) {
    assign(actions, {
      'append.text-annotation': appendAction(
        'bpmn:TextAnnotation',
        'bpmn-icon-text-annotation'
      )
    });
  }

  // delete element entry, only show if allowed by rules
  var deleteAllowed = this._rules.allowed('elements.delete', { elements: [ element ] });

  if (isArray(deleteAllowed)) {
    // was the element returned as a deletion candidate?
    deleteAllowed = deleteAllowed[0] === element;
  }

  if (deleteAllowed) {
    assign(actions, {
      'delete': {
        group: 'edit',
        className: 'bpmn-icon-trash',
        title: this._translate('Remove'),
        action: {
          click: removeElement
        }
      }
    });
  }

  return actions;
};