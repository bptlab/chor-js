import ModelCloneHelper from 'bpmn-js/lib/util/model/ModelCloneHelper';
import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';
import { assign, filter, forEach, omit } from 'min-dash';
import { getProperties, IGNORED_PROPERTIES } from 'bpmn-js/lib/util/model/ModelCloneUtils';
import { createMessageFlowSemantics, linkMessageFlowSemantics } from '../../util/MessageUtil';

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
 * This is copied from BpmnCopyPaste.js because it is not exported and could thus not be reused.
 * This function is called on copy
 * @param element
 * @param descriptor an intermediary object that is later converted to a shape
 * @returns {*}
 */
function bpmnDescriptor(element, descriptor) {
  // Unfortunately the business object is not copied at this point. It will be cloned on paste
  // this makes it necessary to copy some of the attributes already here and save them in the descriptor.
  var businessObject = descriptor.oldBusinessObject = getBusinessObject(element);

  var colors = {};

  descriptor.type = element.type;

  setProperties(descriptor, businessObject.di, ['isExpanded']);

  setProperties(descriptor, element, ['isExpanded', 'collapsed']);

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
    // we copy only bands participant ids to tolerate bands being deleted in original object during paste.
    descriptor.bandShapesParticipantIDs = element.bandShapes.map(band => band.businessObject.id);
  }

  if (is(element, 'bpmn:ChoreographyActivity')) {
    // We need to save the participantRef array as it might be mutated by the user before pasting and cause nasty bugs.
    // Same for initiating participant
    descriptor.copyParticipantRef = businessObject.participantRef.slice();
    descriptor.copyInitParticpant = businessObject.initiatingParticipantRef;
    if (businessObject.messageFlowRef) {
      // We need to copy the message flow and later set the new messages, unfortunately assign() doesn't work
      descriptor.copyMessageFlowRef = businessObject.messageFlowRef.map(flow => {
        const newFlow = {};
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

  if (is(element, 'bpmn:Message')) {
    console.log(descriptor);
    // doNotPaste should not be set before this
    delete element.doNotPaste;
    // We do not want to paste messages that are not visible, because they are default message flow messages
    if (!element.parent.diBand.isMessageVisible) {
      descriptor.doNotPaste = true;
    }
  }

  return descriptor;
}

/**
 * Creates a new Band for a copied band, however, does not set any bounds.
 * @returns di
 * @param descriptor
 * @param bpmnFactory
 * @param newElement
 */
function copyBandDi(descriptor, bpmnFactory, newElement) {
  const fakeBounds = { x: 0, y: 0, width: 0, height: 0 };
  // Todo: double check if assign would be possible here
  const bandDI = bpmnFactory.createDiShape('bpmndi:BPMNShape', fakeBounds, {
    choreographyActivityShape: newElement.businessObject.di,
    bpmnElement: descriptor.businessObject,
    participantBandKind: descriptor.oldDiBand.participantBandKind,
    isMessageVisible: descriptor.oldDiBand.isMessageVisible,
    isMarkerVisible: descriptor.oldDiBand.isMarkerVisible
  });
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
function pasteElement(canvas, bpmnFactory, bpmnRules, helper, context, elementFactory, moddle, injector) {
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
    descriptor.businessObject.participantRef = descriptor.copyParticipantRef;
    descriptor.businessObject.initiatingParticipantRef = descriptor.copyInitParticpant;
    descriptor.bandShapes = [];
    if (descriptor.copyMessageFlowRef) {
      descriptor.copyMessageFlowRef.forEach(flow => {
        const newFlow = createMessageFlowSemantics(injector, descriptor.businessObject, flow.sourceRef);
        newFlow.messageRef.name = flow.messageRef.name;
        linkMessageFlowSemantics(injector, descriptor.businessObject, newFlow);
      });
    }

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

  if (is(descriptor.oldBusinessObject, 'bpmn:Message')) {
    console.log(descriptor);
    //Todo: check if this is really required
    //descriptor.businessObject.$parent = oldBusinessObject.$parent;
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
export default function ChoreoCopyPaste(bpmnFactory, eventBus, copyPaste, clipboard, canvas, bpmnRules, elementFactory, moddle, injector) {
  var helper = new ModelCloneHelper(eventBus, bpmnFactory);
  copyPaste.registerDescriptor(bpmnDescriptor);
  eventBus.on('element.paste', function(context) {
    // Todo: Check if all choreo related things are caught. Plus double check participant.
    pasteElement(canvas, bpmnFactory, bpmnRules, helper, context, elementFactory, moddle, injector);
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