import { assign } from 'min-dash';

const MESSAGE_WIDTH = 35;
const MESSAGE_HEIGHT = MESSAGE_WIDTH / 7 * 5;
export const MESSAGE_DISTANCE = 20;

function removeAndGetIndex(collection, element) {
  let index = collection.indexOf(element);
  collection.splice(index, 1);
  return index;
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
export function linkMessageSemantics(injector, task, messageFlow, indices) {
  let canvas = injector.get('canvas');

  let choreo = canvas.getRootElement().businessObject;
  let definitions = choreo.$parent;
  indices = indices || {
    definitionsIndex: 0,
    choreoIndex: 0,
    taskIndex: 0
  };

  definitions.get('rootElements').splice(indices.definitionsIndex, 0, messageFlow.messageRef);
  choreo.get('messageFlows').splice(indices.choreoIndex, 0, messageFlow);
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
export function unlinkMessageSemantics(injector, task, messageFlow) {
  let canvas = injector.get('canvas');

  let choreo = canvas.getRootElement().businessObject;
  let definitions = choreo.$parent;
  let indices = {};

  // unlink the message from definitions
  indices.definitionsIndex = removeAndGetIndex(
    definitions.get('rootElements'),
    messageFlow.messageRef
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
 * @returns {Object} a semantic message object that is fully linked in the
 *                   overall semantic model and connected to the given task
 *                   as well as participant (source)
 */
export function createMessageSemantics(injector, task, participant) {
  let bpmnFactory = injector.get('bpmnFactory');

  // create the message object
  let message = bpmnFactory.create('bpmn:Message');

  // create the message flow
  let messageFlow = bpmnFactory.create('bpmn:MessageFlow', {
    messageRef: message,
    sourceRef: participant,
    targetRef: task.participantRef.find(p => p != participant)
  });

  linkMessageSemantics(injector, task, messageFlow);
  return message;
}

/**
 * @param {Object} injector
 * @param {Object} bandShape
 * @param {Object} semantic
 * @returns {Object} a message shape attached to the given band shape with
 *                   the given message semantics
 */
export function createMessageShape(injector, bandShape, semantic) {
  let elementFactory = injector.get('elementFactory');

  let data = {
    type: semantic.$type,
    businessObject: semantic
  };
  assign(data, getAttachedMessageBounds(bandShape));
  let messageShape = elementFactory.createShape(data);
  bandShape.attachedMessageShape = messageShape;
  return messageShape;
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