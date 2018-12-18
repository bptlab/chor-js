import {
  isUndefined
} from 'min-dash';

import {
  getBandGapIndex,
  createParticipant,
  updateBands,
  getBandKind,
  updateParticipantBandKinds
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

  // shape level
  let bandShape = activityShape.bandShapes.splice(index, 1)[0];
  context.bandShape = bandShape;
  this._canvas.removeShape(bandShape);

  // semantic business object level
  let participant = activity.participantRef.splice(index, 1)[0];
  if (participant === activity.initiatingParticipantRef) {
    context.isInitiating = true;
    activity.initiatingParticipantRef = activity.participantRef[0];
  }

  // semantic DI level
  let choreo = this._canvas.getRootElement().businessObject;
  let bpmnDiagram = choreo.di;
  removeAndGetIndex(bpmnDiagram.get('planeElement'), bandShape.diBand);
  updateParticipantBandKinds(activity, activityShape.bandShapes.map(bandShape => bandShape.diBand));

  return [activityShape];
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

  // shape level
  activityShape.bandShapes.splice(index, 0, bandShape);
  this._canvas.addShape(bandShape, activityShape, index);

  // semantic business object level
  activity.participantRef.splice(index, 0, bandShape.businessObject);
  if (context.isInitiating) {
    activity.initiatingParticipantRef = bandShape.businessObject;
  }

  // semantic DI level
  let choreo = this._canvas.getRootElement().businessObject;
  let bpmnDiagram = choreo.di;
  bpmnDiagram.get('planeElement').push(bandShape.diBand);
  bandShape.diBand.$parent = bpmnDiagram;
  updateParticipantBandKinds(activity, activityShape.bandShapes.map(bandShape => bandShape.diBand));

  return [activityShape];
};

CreateParticipantBandHandler.prototype.postExecute = function(context) {
  updateBands(this._injector, context.activityShape);
};

CreateParticipantBandHandler.prototype.preExecute = function(context) {
  let activityShape = context.activityShape;
  let activity = activityShape.businessObject;
  let bandShape = context.bandShape;
  let participant = context.participant;

  // if we are adding a new participant, we have to create one
  if (isUndefined(participant)) {
    participant = createParticipant(this._injector);
    context.participant = participant;
    context.index = getBandGapIndex(activityShape.bandShapes.length);
  } else {
    if (context.delete) {
      context.index = activity.participantRef.indexOf(context.participant);
    } else {
      context.index = getBandGapIndex(activityShape.bandShapes.length);
    }
  }

  // if we have no existing band shape, we have to create one
  if (isUndefined(bandShape) && !context.delete) {
    let index = context.index;
    let diBand = this._bpmnFactory.createDiShape(participant, {
      x: 0, // bounds will be set later
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
};

CreateParticipantBandHandler.prototype.execute = function(context) {
  if (context.delete) {
    return this.deleteBand(context);
  } else {
    return this.createBand(context);
  }
};

CreateParticipantBandHandler.prototype.revert = function(context) {
  if (context.delete) {
    return this.createBand(context);
  } else {
    return this.deleteBand(context);
  }
};