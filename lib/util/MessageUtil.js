import { assign } from 'min-dash';
import { is } from 'bpmn-js/lib/util/ModelUtil';

const MESSAGE_WIDTH = 35;
const MESSAGE_HEIGHT = MESSAGE_WIDTH / 7 * 5;
export const MESSAGE_DISTANCE = 20;

export function removeAndGetIndex(collection, element) {
  let index = collection.indexOf(element);
  collection.splice(index, 1);
  return index;
}

/**
 * @param {Object} bandShape
 * @returns {Object} the shape of the message attached to the band (if any)
 */
export function getMessageShape(bandShape) {
  return bandShape.children && bandShape.children.find(child => is(child, 'bpmn:Message'));
}

/**
 * @param {Object} task semantic task object
 * @param {Object} message semantic message object
 * @returns {Object} semantic message flow object attached to the given task
 *                   linking to the given semantic message object
 */
export function getMessageFlow(task, message) {
  return task.get('messageFlowRef').find(messageFlow => messageFlow.messageRef === message);
}

/**
 * Link the given semantic objects into the overall semantic model at the
 * right places. For example, messages are owned by the Definitions element.
 *
 * @param {Object} injector
 * @param {Object} task
 * @param {Object} messageFlow
 * @param {Object} indices optional object containing the former indices of
 *                         the given semantic objects in their respective collection
 *                         for reverts or redos
 */
export function linkMessageFlowSemantics(injector, task, messageFlow, indices) {
  let canvas = injector.get('canvas');

  let choreo = canvas.getRootElement().businessObject;
  let definitions = choreo.$parent;
  let message = messageFlow.messageRef;
  indices = indices || {
    definitionsIndex: 0,
    choreoIndex: 0,
    taskIndex: 0
  };

  definitions.get('rootElements').splice(indices.definitionsIndex, 0, message);
  message.$parent = definitions;
  choreo.get('messageFlows').splice(indices.choreoIndex, 0, messageFlow);
  messageFlow.$parent = choreo;
  task.get('messageFlowRef').splice(indices.taskIndex, 0, messageFlow);
}

/**
 * Unlink the given message flow from the given task and unlink all related
 * semantic elements as well.
 *
 * @param {Object} injector
 * @param {Object} task
 * @param {Object} messageFlow
 * @returns {Object} object containg the former indices of the semantic elements
 *                   in their respective collections for later reverts/redos
 */
export function unlinkMessageFlowSemantics(injector, task, messageFlow) {
  let canvas = injector.get('canvas');

  let choreo = canvas.getRootElement().businessObject;
  let definitions = choreo.$parent;
  let message = messageFlow.messageRef;
  let indices = {};

  // unlink the message from definitions
  indices.definitionsIndex = removeAndGetIndex(
    definitions.get('rootElements'),
    message
  );

  // unlink the message flow from the choreography
  indices.choreoIndex = removeAndGetIndex(
    choreo.get('messageFlows'),
    messageFlow
  );

  // unlink the message flow from the task (oldParent.parent)
  indices.taskIndex = removeAndGetIndex(
    task.get('messageFlowRef'),
    messageFlow
  );

  return indices;
}

/**
 * @param {Object} injector
 * @param {Object} task
 * @param {Object} participant
 * @returns {Object} a semantic message flow object with a new message attached
 */
export function createMessageFlowSemantics(injector, task, participant) {
  let moddle = injector.get('moddle');

  // create the message object
  let message = moddle.create('bpmn:Message');
  message.id = moddle.ids.nextPrefixed('Message_', message);
  const messageFlow = createMessageFlow(injector, message, participant, task.participantRef.find(p => p !== participant));
  return messageFlow;
}

/**
 * Creates and returns a message flow without creating a message
 * @param injector
 * @param message
 * @param sourceParticipant
 * @param targetParticipant
 * @returns {bpmn:MessageFlow}
 */
export function createMessageFlow(injector, message, sourceParticipant, targetParticipant) {
  let moddle = injector.get('moddle');
  let messageFlow = moddle.create('bpmn:MessageFlow', {
    messageRef: message,
    sourceRef: sourceParticipant,
    targetRef: targetParticipant
  });
  messageFlow.id = moddle.ids.nextPrefixed('MessageFlow_', messageFlow);

  return messageFlow;
}

/**
 * @param {Object} injector
 * @param {Object} bandShape
 * @param {Object} messageFlow
 * @returns {Object} a message shape attached to the given band shape with
 *                   the given message semantics
 */
export function createMessageShape(injector, bandShape, messageFlow) {
  let elementFactory = injector.get('elementFactory');
  let semantic = messageFlow.get('messageRef');

  let data = {
    type: semantic.$type,
    businessObject: semantic,
    hidden: bandShape.hidden || !bandShape.diBand.isMessageVisible
  };
  assign(data, getAttachedMessageBounds(bandShape));
  let messageShape = elementFactory.createShape(data);
  return messageShape;
}

/**
 * Get the attached message shape of a bandShape
 * @param bandShape
 * @returns {Array<Result>}
 */
export function getAttachedMessageShape(bandShape) {
  return bandShape.children.find(m => is(m, 'bpmn:Message'));
}

/**
 * @param {Object} bandShape the shape the messages ought to be attached to
 * @returns {Object} bounds of the message
 */
export function getAttachedMessageBounds(bandShape) {
  let diBand = bandShape.diBand;
  let isBottom = diBand.participantBandKind.startsWith('bottom');
  let bounds = {
    x: bandShape.x + bandShape.width / 2 - MESSAGE_WIDTH / 2,
    y: bandShape.y,
    width: MESSAGE_WIDTH,
    height: MESSAGE_HEIGHT
  };
  if (isBottom) {
    bounds.y += bandShape.height + MESSAGE_DISTANCE;
  } else {
    bounds.y -= MESSAGE_DISTANCE + MESSAGE_HEIGHT;
  }
  return bounds;
}