import ModelCloneHelper from 'bpmn-js/lib/util/model/ModelCloneHelper';
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { filter, forEach } from 'min-dash';
import { getProperties, IGNORED_PROPERTIES } from 'bpmn-js/lib/util/model/ModelCloneUtils';

/**
 * This is copied from BpmnCopyPaste.js because it is not exported and could thus not be reused
 * @param descriptor
 * @param data
 * @param properties
 */
function setProperties(descriptor, data, properties) {
  forEach(properties, function(property) {
    if (data[property] !== undefined) {
      descriptor[property] = data[property];
    }
  });
}

/**
 * This is copied from BpmnCopyPaste.js because it is not exported and could thus not be reused
 * @param element
 * @param properties
 */
function removeProperties(element, properties) {
  forEach(properties, function(prop) {
    if (element[prop]) {
      delete element[prop];
    }
  });
}

/**
 * Creates a descriptor for copying bpmn elements. A descriptor is an intermediary object that is later turned into a
 * Shape object. (Potentially also Label object). This function is called <b>on</b> copy.
 * This is copied from BpmnCopyPaste.js because it is not exported and could thus not be reused
 * @param element
 * @param descriptor possibly similar to shape objects?
 * @returns {*}
 */
function bpmnDescriptor(element, descriptor) {
  var businessObject = descriptor.oldBusinessObject = getBusinessObject(element);

  var colors = {};

  descriptor.type = element.type;

  setProperties(descriptor, businessObject.di, ['isExpanded']);

  setProperties(colors, businessObject.di, ['fill', 'stroke']);

  descriptor.colors = colors;

  if (element.type === 'label') {
    return descriptor;
  }

  setProperties(descriptor, businessObject, [
    'processRef',
    'triggeredByEvent'
  ]);

  if (businessObject.default) {
    descriptor.default = businessObject.default.id;
  }

  // save the band shape to preserve order of bands
  if (element.bandShapes) {
    descriptor.oldBandShapes = element.bandShapes;
  }

  return descriptor;
}

/**
 * Handles the paste of a bpmn element
 * This is copied from BpmnCopyPaste.js because it is not exported and could thus not be reused
 * @param canvas
 * @param bpmnFactory
 * @param bpmnRules
 * @param helper
 * @param context
 */
function bpmnElementPasteHandler(canvas, bpmnFactory, bpmnRules, helper, context) {
  var descriptor = context.descriptor,
    createdElements = context.createdElements,
    parent = descriptor.parent,
    rootElement = canvas.getRootElement(),
    oldBusinessObject = descriptor.oldBusinessObject,
    newBusinessObject,
    source,
    target,
    canConnect;

  newBusinessObject = bpmnFactory.create(oldBusinessObject.$type);

  var properties = getProperties(oldBusinessObject.$descriptor);

  properties = filter(properties, function(property) {
    return IGNORED_PROPERTIES.indexOf(property.replace(/bpmn:/, '')) === -1;
  });

  descriptor.businessObject = helper.clone(oldBusinessObject, newBusinessObject, properties);

  if (descriptor.type === 'label') {
    return;
  }

  if (is(parent, 'bpmn:Process')) {
    descriptor.parent = is(rootElement, 'bpmn:Collaboration') ? rootElement : parent;
  }

  if (descriptor.type === 'bpmn:DataOutputAssociation' ||
    descriptor.type === 'bpmn:DataInputAssociation' ||
    descriptor.type === 'bpmn:MessageFlow') {
    descriptor.parent = rootElement;
  }

  if (is(parent, 'bpmn:Lane')) {
    descriptor.parent = parent.parent;
  }

  // make sure that the correct type of connection is created
  if (descriptor.waypoints) {
    source = createdElements[descriptor.source];
    target = createdElements[descriptor.target];

    if (source && target) {
      source = source.element;
      target = target.element;
    }

    canConnect = bpmnRules.canConnect(source, target);

    if (canConnect) {
      descriptor.type = canConnect.type;
    }
  }

  // remove the id or else we cannot paste multiple times
  delete newBusinessObject.id;

  // assign an ID
  bpmnFactory._ensureId(newBusinessObject);
  // Todo check if this fires for choreo participants
  if (descriptor.type === 'bpmn:Participant' && descriptor.processRef) {
    descriptor.processRef = newBusinessObject.processRef = bpmnFactory.create('bpmn:Process');
  }

  setProperties(newBusinessObject, descriptor, [
    'isExpanded',
    'triggeredByEvent'
  ]);

  removeProperties(descriptor, [
    'triggeredByEvent'
  ]);
}

function choreoElementPasteHandler(canvas, bpmnFactory, bpmnRules, helper, context) {
  // the descriptor is most likely an intermediary object whose attributes will be assigned to a shape object which is
  // created later.
  var descriptor = context.descriptor,
    createdElements = context.createdElements,
    parent = descriptor.parent,
    rootElement = canvas.getRootElement(),
    oldBusinessObject = descriptor.oldBusinessObject,
    newBusinessObject,
    source,
    target,
    canConnect;

  newBusinessObject = bpmnFactory.create(oldBusinessObject.$type);
  var properties = getProperties(oldBusinessObject.$descriptor);

  properties = filter(properties, function(property) {
    return IGNORED_PROPERTIES.indexOf(property.replace(/bpmn:/, '')) === -1;
  });

  descriptor.businessObject = helper.clone(oldBusinessObject, newBusinessObject, properties);
  //clone additional stuff not part of bpmnjs
  if (is(descriptor.oldBusinessObject, 'bpmn:ChoreographyActivity')) {
    descriptor.businessObject.participantRef = oldBusinessObject.participantRef;
    descriptor.businessObject.initiatingParticipantRef = oldBusinessObject.initiatingParticipantRef;
    //ChreateChoreoTaskBahavior.js will add all necessary DIs and bandShape after the shape has been created.
  }

  //copied from bpmnjs
  // make sure that the correct type of connection is created
  if (descriptor.waypoints) {
    source = createdElements[descriptor.source];
    target = createdElements[descriptor.target];

    if (source && target) {
      source = source.element;
      target = target.element;
    }

    canConnect = bpmnRules.canConnect(source, target);

    if (canConnect) {
      descriptor.type = canConnect.type;
    }
  }

  // remove the id or else we cannot paste multiple times
  delete newBusinessObject.id;

  // assign an ID
  bpmnFactory._ensureId(newBusinessObject);
  // Todo check if this fires for choreo participants
  /*if (descriptor.type === 'bpmn:Participant' && descriptor.processRef) {
    descriptor.processRef = newBusinessObject.processRef = bpmnFactory.create('bpmn:Process');
  }*/

  setProperties(newBusinessObject, descriptor, [
    'isExpanded',
    'triggeredByEvent'
  ]);
  // todo: remove, because not necessary?
  removeProperties(descriptor, [
    'triggeredByEvent'
  ]);

}

/**
 * This Module is responsible for pasting single elements. It completely replaces the BpmnCopyPaste module as
 * that has incompatible behaviour that cannot be overwritten. Some functionality is copied and used when applicable.
 * @param bpmnFactory
 * @param eventBus
 * @param copyPaste
 * @param clipboard
 * @param canvas
 * @param bpmnRules
 * @constructor
 */
export default function ChoreoCopyPaste(bpmnFactory, eventBus, copyPaste, clipboard, canvas, bpmnRules) {
  var helper = new ModelCloneHelper(eventBus, bpmnFactory);
  copyPaste.registerDescriptor(bpmnDescriptor);
  eventBus.on('element.paste', function(context) {
    // Todo: Check if all choreo related things are caught. Plus double check participant.
    if (is(context.descriptor.oldBusinessObject, 'bpmn:ChoreographyActivity')
      || is(context.descriptor.oldBusinessObject, 'bpmn:Message')
      || is(context.descriptor.oldBusinessObject, 'bpmn:Participant')) {
      choreoElementPasteHandler(canvas, bpmnFactory, bpmnRules, helper, context);
    } else {
      bpmnElementPasteHandler(canvas, bpmnFactory, bpmnRules, helper, context);
    }
  });

}

ChoreoCopyPaste.$inject = [
  'bpmnFactory',
  'eventBus',
  'copyPaste',
  'clipboard',
  'canvas',
  'bpmnRules'
];