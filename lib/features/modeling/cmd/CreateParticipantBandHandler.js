import {
  assign,
  isUndefined
} from 'min-dash';

import {
  resetAllBands,
  getBandGapIndex,
  createParticipant,
  updateBands,
  getBandKind
} from '../../../util/BandUtil';
import { removeAndGetIndex } from '../../../util/MessageUtil';

/**
 * Command handler that fires on `band.delete` and `band.create`.
 *
 * We do not reuse the regular `shape.delete` and `shape.create` commands as bpmn-js has loads of
 * intercepts regarding participants and lanes we want to avoid.
 *
 * The context structure looks like this:
 * - delete
 *     Whether to delete or add the band.
 * - activityShape
 *     Activity shape to which the band is attached or supposed to be attached.
 * - index
 *     The index position at which to insert the band.
 * - bandShape (optional)
 *     Shape to add. If no shape is given, a new one must be created.
 * - isInitiating (optional)
 *     Whether the band should be the initiating one or not.
 */
export default function CreateParticipantBandHandler(
    injector, commandStack, eventBus, canvas, bpmnFactory, elementFactory, moddle
) {
  this._injector = injector;
  this._commandStack = commandStack;
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._bpmnFactory = bpmnFactory;
  this._elementFactory = elementFactory;
  this._model = moddle;
}

CreateParticipantBandHandler.$inject = [
  'injector',
  'commandStack',
  'eventBus',
  'canvas',
  'bpmnFactory',
  'elementFactory',
  'moddle'
];

/**
 * Delete the band specified in the context.
 *
 * @param {Object} context see above for structure
 */
CreateParticipantBandHandler.prototype.deleteBand = function(context) {
  let activityShape = context.activityShape;
  let activity = activityShape.businessObject;
  let index = context.index;

  // remove elements from collections
  let bandShape = activityShape.bandShapes.splice(index, 1)[0];
  let participant = activity.participantRef.splice(index, 1)[0];
  context.bandShape = bandShape;

  // remove the bands from the BPMNDiagram semantic object
  let choreo = this._canvas.getRootElement().businessObject;
  let bpmnDiagram = choreo.di;
  removeAndGetIndex(bpmnDiagram.get('planeElement'), bandShape.diBand);

  // remove shape from canvas
  this._canvas.removeShape(bandShape);

  // change initiating participant if needed
  if (participant === activity.initiatingParticipantRef) {
    context.isInitiating = true;
    activity.initiatingParticipantRef = activity.participantRef[0];
  }

  resetAllBands(activity, activityShape.bandShapes.map(bandShape => bandShape.diBand), activityShape);
  updateBands(activityShape, this._eventBus);
};

/**
 * Create/attach a band as specified in the context.
 *
 * @param {Object} context see above for structure
 */
CreateParticipantBandHandler.prototype.createBand = function(context) {
  let activityShape = context.activityShape;
  let activity = activityShape.businessObject;
  let index = context.index;
  let bandShape = context.bandShape;
  let participant = context.participant;

  // if we have no existing band shape, we have to create one
  if (isUndefined(bandShape)) {
    let diBand = this._bpmnFactory.createDiShape(participant, {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }, {
      choreographyActivityShape: activity.di,
      participantBandKind: getBandKind(index, activityShape.bandShapes.length + 1, context.isInitiating),
      isMessageVisible: false
    });
    bandShape = this._elementFactory.createShape({
      type: 'bpmn:Participant',
      id: this._model.ids.nextPrefixed('ParticipantBand_', participant),
      businessObject: participant,
      diBand: diBand,
      activityShape: activityShape,
      x: 0, // dummy values for bounds, these will be set later
      y: 0,
      width: 0,
      height: 0
    });
    context.bandShape = bandShape;
    participant.di = diBand;
  }

  // add the band to the BPMNDiagram semantic object
  let choreo = this._canvas.getRootElement().businessObject;
  let bpmnDiagram = choreo.di;
  bpmnDiagram.get('planeElement').push(bandShape.diBand);
  bandShape.diBand.$parent = bpmnDiagram;

  // add band to canvas
  this._canvas.addShape(bandShape, activityShape, index);

  // add elements to collections
  activityShape.bandShapes.splice(index, 0, bandShape);
  activity.participantRef.splice(index, 0, bandShape.businessObject);

  // check if this is supposed to be the initiating band
  if (context.isInitiating) {
    activity.initiatingParticipantRef = bandShape.businessObject;
  }

  resetAllBands(activity, activityShape.bandShapes.map(bandShape => bandShape.diBand), activityShape);
  updateBands(activityShape, this._eventBus);
};

CreateParticipantBandHandler.prototype.preExecute = function(context) {
  let activityShape = context.activityShape;
  let activity = activityShape.businessObject;

  if (isUndefined(context.participant)) {
    context.participant = createParticipant(this._injector);
    context.index = getBandGapIndex(activityShape.bandShapes.length);
  } else {
    context.index = activity.participantRef.indexOf(context.participant);
  }
}

CreateParticipantBandHandler.prototype.execute = function(context) {
  if (context.delete) {
    this.deleteBand(context);
  } else {
    this.createBand(context);
  }
};

CreateParticipantBandHandler.prototype.revert = function(context) {
  if (context.delete) {
    this.createBand(context);
  } else {
    this.deleteBand(context);
  }
};