import ModelCloneHelper from 'bpmn-js/lib/util/model/ModelCloneHelper';
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { assign, filter, forEach } from 'min-dash';
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
 * Shape object. (Potentially also Label object).
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
    // we copy only bands participant ids to tolerate bands being deleted during paste.
    descriptor.bandShapesParticipantIDs = element.bandShapes.map(band => band.businessObject.id);
  }

  if (element.diBand) {
    descriptor.oldDiBand = element.diBand;
  }

  return descriptor;
}

/**
 * Creates a new Band for a copied band, however, does not set any bounds.
 * @returns {djs.model.Shape|*}
 * @param descriptor
 * @param bpmnFactory
 * @param newElement
 */
function copyBandDi(descriptor, bpmnFactory, newElement) {
  const fakeBounds = { x: 0, y: 0, width: 0, height: 0 };
  const bandDI = bpmnFactory.createDiShape('bpmndi:BPMNShape', fakeBounds, {
    choreographyActivityShape: newElement.businessObject.di,
    bpmnElement: descriptor.businessObject,
    participantBandKind: descriptor.oldDiBand.participantBandKind,
    isMessageVisible: descriptor.oldDiBand.isMessageVisible
  });

  /*
    const bandShape = elementFactory.createShape(assign({
      type: 'bpmn:Participant',
      id: moddle.ids.nextPrefixed('ParticipantBand_', descriptor.businessObject),
      businessObject: descriptor.businessObject,
      diBand: bandDI,
      activityShape: descriptor.parent
    }, fakeBounds));
  */
  return bandDI;
}


/**
 * Handles the paste of a bpmn element
 * This is mostly copied from BpmnCopyPaste.js because it is not exported and could therefore
 * not be reused because we need to add special behavior choreos.
 * @param canvas
 * @param bpmnFactory
 * @param bpmnRules
 * @param helper
 * @param context
 */
function elementPasteHandler(canvas, bpmnFactory, bpmnRules, helper, context, elementFactory, moddle) {
  // the descriptor is an intermediary object whose attributes will be assigned to a
  // shape object which is created later.

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

  //// copy element
  descriptor.businessObject = helper.clone(oldBusinessObject, newBusinessObject, properties);

  //clone additional stuff not part of bpmnjs
  if (is(descriptor.oldBusinessObject, 'bpmn:ChoreographyActivity')) {
    descriptor.businessObject.participantRef = oldBusinessObject.participantRef;
    descriptor.businessObject.initiatingParticipantRef = oldBusinessObject.initiatingParticipantRef;
    descriptor.bandShapes = [];
    //CreateChoreoTaskBehavior.js will add all necessary DIs and bandShape after the shape has been created.
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
      // This band will not be created by createParticipantBand Handler but will go directly to createShape
    }
  }

  /// copy element end
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
  // Does not fire for Choreo participants because processRef is undefined
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
 * @param model
 * @constructor
 */
export default function ChoreoCopyPaste(bpmnFactory, eventBus, copyPaste, clipboard, canvas, bpmnRules, elementFactory, moddle) {
  var helper = new ModelCloneHelper(eventBus, bpmnFactory);
  copyPaste.registerDescriptor(bpmnDescriptor);
  eventBus.on('element.paste', function(context) {
    // Todo: Check if all choreo related things are caught. Plus double check participant.
    elementPasteHandler(canvas, bpmnFactory, bpmnRules, helper, context, elementFactory, moddle);
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
  'moddle'
];