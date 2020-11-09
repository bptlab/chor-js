import inherits from 'inherits';

import BaseContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';

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
 *
 * @constructor
 * @param {Injector} injector
 */
export default function ContextPadProvider(injector) {
  injector.invoke(BaseContextPadProvider, this);
}

inherits(ContextPadProvider, BaseContextPadProvider);

ContextPadProvider.$inject = [
  'injector'
];

/**
 * @param {Object} element Shape the user selected
 *
 * @return {Object} Context pad entries for the selected shape
 */
ContextPadProvider.prototype.getContextPadEntries = function(element) {
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

  function appendAction(type, className, title, options) {
    if (typeof title !== 'string') {
      options = title;
      title = self._translate('Append {type}', { type: type.replace(/^bpmn:/, '') });
    }

    function appendStart(event, element) {
      var shape = self._elementFactory.createShape(assign({ type: type }, options));
      self._create.start(event, shape, {
        source: element
      });
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

  function popupMenuPosition(element) {

    const Y_OFFSET = 5;

    const diagramContainer = self._canvas.getContainer();
    const pad = self._contextPad.getPad(element).html;

    const diagramRect = diagramContainer.getBoundingClientRect();
    const padRect = pad.getBoundingClientRect();

    const top = padRect.top - diagramRect.top;
    const left = padRect.left - diagramRect.left;

    const pos = {
      x: left,
      y: top + padRect.height + Y_OFFSET
    };

    return pos;
  }

  // --------------------------------------------------------------------------------------------
  // appending new elements
  if (is(businessObject, 'bpmn:FlowNode')) {
    // all elements except for end events can connect to at least choreography tasks
    if (!is(businessObject, 'bpmn:EndEvent')) {
      assign(actions, {
        'connect': {
          group: 'append',
          className: 'bpmn-icon-connection',
          title: this._translate('Connect using Sequence Flow'),
          action: {
            click: startConnect,
            dragstart: startConnect
          }
        },
        'append.choreography-task': appendAction(
          'bpmn:ChoreographyTask',
          'choreo-icon-choreography-task'
        )
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

    // flow nodes can be annotated
    if (is(businessObject, 'bpmn:FlowNode')) {
      assign(actions, {
        'append.text-annotation': appendAction(
          'bpmn:TextAnnotation',
          'bpmn-icon-text-annotation'
        )
      });
    }
  }

  // --------------------------------------------------------------------------------------------
  // move participant bands
  if (is(element, 'bpmn:Participant')) {
    if (this._rules.allowed('band.swap', {
      activityShape: element.activityShape,
      bandShape: element,
      upwards: true
    })) {
      // move up
      assign(actions, {
        'band.swap-upwards': {
          group: 'move-a',
          className: 'choreo-icon-up',
          title: this._translate('Move upwards'),
          action: {
            click: () => self._modeling.swapParticipantBand(element.activityShape, element, true)
          }
        }
      });
    }

    if (this._rules.allowed('band.swap', {
      activityShape: element.activityShape,
      bandShape: element,
      upwards: false
    })) {
      // move down
      assign(actions, {
        'band.swap-downwards': {
          group: 'move-b',
          className: 'choreo-icon-down',
          title: this._translate('Move downwards'),
          action: {
            click: () => self._modeling.swapParticipantBand(element.activityShape, element, false)
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------------------------
  // change participant
  if (is(businessObject, 'bpmn:Participant')) {
    assign(actions, {
      'popup.participant': {
        group: 'edit',
        className: 'bpmn-icon-screw-wrench',
        title: this._translate('Change participant'),
        action: {
          click: (event, element) => {
            const position = assign(popupMenuPosition(element), {
              cursor: { x: event.x, y: event.y }
            });
            self._popupMenu.open(element, 'participant-provider', position);
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------------------------
  // Change properties of choreography activities.
  if (is(businessObject, 'bpmn:ChoreographyActivity')) {
    assign(actions, {
      'loopPopup': {
        group: 'edit',
        className: 'bpmn-icon-screw-wrench',
        title: this._translate('Edit properties'),
        action: {
          click: (event, element) => {
            const position = assign(popupMenuPosition(element), {
              cursor: { x: event.x, y: event.y }
            });
            self._popupMenu.open(element, 'loop-provider', position);
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------------------------
  // Link call choreographies.
  if (is(businessObject, 'bpmn:CallChoreography')) {
    assign(actions, {
      'linkCallChoreo': {
        group: 'edit',
        className: 'choreo-icon-link',
        title: this._translate('Link choreography'),
        action: {
          click: (event, element) => {
            const position = assign(popupMenuPosition(element), {
              cursor: { x: event.x, y: event.y }
            });
            self._popupMenu.open(element, 'link-call-choreo-provider', position);
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------------------------
  // replace menu for sequence flows, events, gateways, etc.
  if (!self._popupMenu.isEmpty(element, 'chor-replace')) {
    assign(actions, {
      'replace': {
        group: 'edit',
        className: 'bpmn-icon-screw-wrench',
        title: self._translate('Change type'),
        action: {
          click: function(event, element) {
            var position = assign(popupMenuPosition(element), {
              cursor: { x: event.x, y: event.y }
            });
            self._popupMenu.open(element, 'chor-replace', position);
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------------------------
  // add new participant band
  if (is(element, 'bpmn:SubChoreography') || is(element, 'bpmn:CallChoreography')) {
    if (this._rules.allowed('band.create', {
      activityShape: element
    })) {
      assign(actions, {
        'band.create': {
          group: 'edit',
          className: 'choreo-icon-add-participant',
          title: this._translate('Add new band'),
          action: {
            click: (event, element) => {
              const position = assign(popupMenuPosition(element), {
                cursor: { x: event.x, y: event.y }
              });
              self._popupMenu.open(element, 'participant-provider', position);
            }
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------------------------
  // change participant bands
  if (is(element, 'bpmn:Participant')) {
    // delete
    if (this._rules.allowed('band.delete', {
      activityShape: element.activityShape
    })) {
      assign(actions, {
        'band.delete': {
          group: 'edit',
          className: 'choreo-icon-remove-participant',
          title: this._translate('Remove band'),
          action: {
            click: () => self._modeling.deleteParticipantBand(element.activityShape, element.businessObject)
          }
        }
      });
    }

    // participant linking
    if (is(element.parent, 'bpmn:CallChoreography') && element.parent.businessObject.calledChoreographyRef) {
      assign(actions, {
        'popup.participant-linking': {
          group: 'edit',
          className: 'choreo-icon-link-participant',
          title: this._translate('Link participant'),
          action: {
            click: (event, element) => {
              const position = assign(popupMenuPosition(element), {
                cursor: { x: event.x, y: event.y }
              });
              self._popupMenu.open(element, 'participant-linking-provider', position);
            }
          }
        }
      });
    }

    // swap initiating band
    if (this._rules.allowed('band.canInitiatingBeSwapped', { bandShape: element })) {
      assign(actions, {
        'band.swapInitiatingParticipant': {
          group: 'edit',
          className: 'choreo-icon-toggle-initiating',
          title: this._translate('Toggle initiating'),
          action: {
            click: () => self._modeling.swapInitiatingParticipant(element)
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------------------------
  // message visibility toggle
  let messageToggle = this._rules.allowed('message.toggle', { element: element });
  switch (messageToggle) {
  case 'show':
  case 'hide':
    assign(actions, {
      'message.toggle': {
        group: 'edit',
        className: 'choreo-icon-' + messageToggle + '-message',
        title: this._translate(messageToggle.charAt(0).toUpperCase() + messageToggle.slice(1) + ' message'),
        action: {
          click: () => self._modeling.toggleMessageVisibility(element)
        }
      }
    });
    break;
  case 'create':
    assign(actions, {
      'message.add': {
        group: 'edit',
        className: 'choreo-icon-show-message',
        title: this._translate('Add message'),
        action: {
          click: () => self._modeling.addMessage(element)
        }
      }
    });
    break;
  }

  // --------------------------------------------------------------------------------------------
  // toggle collapse of sub-choreos
  if (is(businessObject, 'bpmn:SubChoreography')) {
    assign(actions, {
      'shape.toggleCollapse': {
        group: 'edit',
        className: element.collapsed ? 'bpmn-icon-sub-process-marker' : 'choreo-icon-collapse-marker',
        title: this._translate('Collapse sub-choreography'),
        action: {
          click: () => self._modeling.toggleCollapse(element)
        }
      }
    });
  }

  // --------------------------------------------------------------------------------------------
  // delete element entry, only show if allowed by rules
  var deleteAllowed = this._rules.allowed('elements.delete', { elements: [element] });

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
          click: () => self._modeling.removeElements([element])
        }
      }
    });
  }

  return actions;
};