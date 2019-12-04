import ModelCloneHelper from 'bpmn-js/lib/util/model/ModelCloneHelper';
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { assign, filter, forEach } from 'min-dash';
import { getProperties, IGNORED_PROPERTIES } from 'bpmn-js/lib/util/model/ModelCloneUtils';

/**
 * This Module is responsible for pasting single elements. It completely replaces the BpmnCopyPaste module as
 * that has incompatible behaviour that cannot be overwritten. Some functionality is copied and used when applicable.
 * @param bpmnFactory
 * @param eventBus
 * @param copyPaste
 * @param clipboard
 * @param canvas
 * @param bpmnRules
 * @param elementFactory
 * @param moddle
 * @param injector
 * @constructor
 */
export default function ChoreoCopyPaste(bpmnFactory, eventBus, copyPaste, clipboard, canvas, bpmnRules, elementFactory, moddle, injector) {
  var helper = new ModelCloneHelper(eventBus, bpmnFactory);
  copyPaste.registerDescriptor((element, descriptor) => this.bpmnDescriptor(element, descriptor));
  eventBus.on('element.paste', context => {
    this.pasteElement(canvas, bpmnFactory, bpmnRules, helper, context, elementFactory, moddle, injector);
  });

}

ChoreoCopyPaste.$inject = [
  'bpmnFactory',
  'eventBus',
  'copyPaste',
  'clipboard',
  'canvas',
  'bpmnRules',
  'elementFactory',
  'moddle',
  'injector'
];


/**
 * This is copied from BpmnCopyPaste.js because it is not exported and could thus not be reused
 * @param descriptor
 * @param data
 * @param properties
 */
ChoreoCopyPaste.prototype.setProperties = function(descriptor, data, properties) {
  forEach(properties, function(property) {
    if (data[property] !== undefined) {
      descriptor[property] = data[property];
    }
  });
};

/**
 * This is copied from BpmnCopyPaste.js because it is not exported and could thus not be reused
 * @param element
 * @param properties
 */
ChoreoCopyPaste.prototype.removeProperties = function removeProperties(element, properties) {
  forEach(properties, function(prop) {
    if (element[prop]) {
      delete element[prop];
    }
  });
};

/**
 * Creates a descriptor for copying bpmn elements. A descriptor is an intermediary object that is later turned into a
 * Shape object. (Potentially also Label object).
 * This is copied from BpmnCopyPaste.js because it is not exported and could thus not be reused.
 * This function is called on copy
 * @param element
 * @param descriptor an intermediary object that is later converted to a shape
 * @returns {*}
 */
ChoreoCopyPaste.prototype.bpmnDescriptor = function(element, descriptor) {
  // Unfortunately the business object is not copied at this point. It will be cloned on paste
  // this makes it necessary to copy some of the attributes already here and save them in the descriptor.
  let businessObject = getBusinessObject(element);
  descriptor.oldBusinessObject = businessObject;
  var colors = {};

  descriptor.type = element.type;

  this.setProperties(descriptor, businessObject.di, ['isExpanded']);

  this.setProperties(descriptor, element, ['collapsed', 'hidden']);

  this.setProperties(colors, businessObject.di, ['fill', 'stroke']);

  descriptor.colors = colors;

  if (element.type === 'label') {
    // Apparently we need to return early if element is a label.
    return descriptor;
  }

  // This is concerned with processes and moste likely not relevant for choreos. It is copied from bpmn.js
  this.setProperties(descriptor, businessObject, [
    'processRef',
    'triggeredByEvent'
  ]);
  // This is copied from bpmn.js and has something to do with sequence flows
  if (businessObject.default) {
    descriptor.default = businessObject.default.id;
  }

  if (is(element, 'bpmn:ChoreographyActivity')) {
    // We need to save the participantRef array as it might be mutated by the user before pasting and cause nasty bugs.
    // This array will also be used to reconstruct the band shape order
    // ATTENTION: This assumes that Participant Objects cannot be deleted.
    // Same for initiating participant
    descriptor.copyParticipantRef = businessObject.participantRef.slice();
    descriptor.copyInitParticpant = businessObject.initiatingParticipantRef;
    if (is(element, 'bpmn:CallChoreography')) {
      descriptor.copyParticipantAssociations = businessObject.participantAssociations;
      descriptor.copyCalledChoreoRef = businessObject.calledChoreographyRef;
    }
    if (businessObject.messageFlowRef) {
      // We need to copy the message flow and later set the new messages, unfortunately assign() doesn't work
      // because the keys of a MessageFlow are not enumerable
      descriptor.copyMessageFlowRef = businessObject.messageFlowRef.map(flow => {
        const newFlow = assign({}, flow);
        newFlow.messageRef = flow.messageRef;
        newFlow.targetRef = flow.targetRef;
        newFlow.sourceRef = flow.sourceRef;
        newFlow.$type = flow.$type;
        newFlow.$parent = flow.$parent;
        return newFlow;
      });
    }

  }

  if (element.diBand) {
    // shallow copy of di properties to preserve e.g. participantBandKind
    descriptor.oldDiBand = assign({}, element.diBand);
  }

  return descriptor;
};

/**
 * Creates a new Band for a copied band, however, does not set any bounds.
 * @returns di
 * @param descriptor
 * @param bpmnFactory
 * @param newElement
 */
function copyBandDi(descriptor, bpmnFactory, newElement) {
  const tempBounds = { x: 0, y: 0, width: 0, height: 0 };
  // Todo: this leads to 0 bounds di in xml.
  // The problem is that the final position of the bands is not known yet
  const bandDI = bpmnFactory.createDiShape('bpmndi:BPMNShape', tempBounds, {
    choreographyActivityShape: newElement.businessObject.di,
    bpmnElement: descriptor.businessObject,
    participantBandKind: descriptor.oldDiBand.participantBandKind,
    isMessageVisible: descriptor.oldDiBand.isMessageVisible,
    isMarkerVisible: descriptor.oldDiBand.isMarkerVisible
  });
  return bandDI;
}


/**
 * Handles the paste of a Choreo element
 * This is mostly copied from BpmnCopyPaste.js because it is not exported and could, therefore,
 * not be reused because we need to add special behavior for choreo elements.
 * @param canvas
 * @param bpmnFactory
 * @param bpmnRules
 * @param helper
 * @param context
 * @param elementFactory
 * @param moddle
 * @param injector
 */
ChoreoCopyPaste.prototype.pasteElement = function(canvas, bpmnFactory, bpmnRules, helper, context, elementFactory, moddle, injector) {
  // the descriptor is an intermediary object whose attributes will be assigned to a
  // shape object which is created later thus some things cannot be set yet. Especially shape relations.

  let descriptor = context.descriptor;
  const createdElements = context.createdElements;
  const parent = descriptor.parent;
  const rootElement = canvas.getRootElement();
  const oldBusinessObject = descriptor.oldBusinessObject;
  let newBusinessObject;
  let source;
  let target;
  let canConnect;

  newBusinessObject = bpmnFactory.create(oldBusinessObject.$type);

  var properties = getProperties(oldBusinessObject.$descriptor);

  properties = filter(properties, function(property) {
    return IGNORED_PROPERTIES.indexOf(property.replace(/bpmn:/, '')) === -1;
  });

  // copies business object
  descriptor.businessObject = helper.clone(oldBusinessObject, newBusinessObject, properties);

  // clone additional stuff which is specific to choreos and not part of bpmn.js

  if (is(descriptor.oldBusinessObject, 'bpmn:ChoreographyActivity')) {
    descriptor.businessObject.participantRef = descriptor.copyParticipantRef;
    descriptor.businessObject.initiatingParticipantRef = descriptor.copyInitParticpant;
    descriptor.bandShapes = [];
    if (is(descriptor.oldBusinessObject, 'bpmn:CallChoreography')) {
      descriptor.businessObject.participantAssociations = descriptor.copyParticipantAssociations;
      descriptor.businessObject.calledChoreographyRef = descriptor.copyCalledChoreoRef;
    }
  }

  if (descriptor.parent && descriptor.parent.oldBusinessObject &&
    createdElements[descriptor.parent.oldBusinessObject.id]) {

    const newElement = createdElements[descriptor.parent.oldBusinessObject.id].element;

    if (is(newElement.oldBusinessObject, 'bpmn:ChoreographyActivity')
      && is(descriptor.businessObject, 'bpmn:Participant')) {
      // we need to overwrite the created business object because bands do not need a new one
      descriptor.businessObject = oldBusinessObject;
      // The id will be overwritten by ElementFactory with the business objects id. So we have to set it again later.
      descriptor.id = moddle.ids.nextPrefixed('ParticipantBand_', descriptor.businessObject);
      descriptor.diBand = copyBandDi(descriptor, bpmnFactory, newElement);
      descriptor.activityShape = newElement;
    }
  }

  // copy element end
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
  // Does not fire for Choreo participants because processRef is undefined, could be removed?
  if (descriptor.type === 'bpmn:Participant' && descriptor.processRef) {
    descriptor.processRef = newBusinessObject.processRef = bpmnFactory.create('bpmn:Process');
  }

  this.setProperties(newBusinessObject, descriptor, [
    'isExpanded',
    'triggeredByEvent'
  ]);

  this.removeProperties(descriptor, [
    'triggeredByEvent'
  ]);
};

