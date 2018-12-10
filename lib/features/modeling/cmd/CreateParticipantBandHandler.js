import {
  assign,
  isUndefined
} from 'min-dash';

import {
  resetAllBands,
  getBandGapIndex
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
    commandStack, eventBus, canvas, bpmnFactory, elementFactory, moddle
) {
  this._commandStack = commandStack;
  this._eventBus = eventBus;
  this._canvas = canvas;
  this._bpmnFactory = bpmnFactory;
  this._elementFactory = elementFactory;
  this._model = moddle;
}

CreateParticipantBandHandler.$inject = [
  'commandStack',
  'eventBus',
  'canvas',
  'bpmnFactory',
  'elementFactory',
  'moddle'
];

/**
 * This function updates all the positions and attributes of the bands connected to the activity.
 * Appropriate events to redraw all shapes are fired.
 *
 * @param {Object} context see above for structure
 */
CreateParticipantBandHandler.prototype.updateAllBandShapes = function(context) {
  let activityShape = context.activityShape;
  let diBands = activityShape.bandShapes.map(bandShape => bandShape.diBand);

  // reset bounds in the DI
  resetAllBands(activityShape.businessObject, diBands, activityShape);

  // update the band shapes accordingly and redraw
  activityShape.bandShapes.forEach(bandShape => {
    let bounds = bandShape.diBand.bounds;
    assign(bandShape, bounds);
    this._eventBus.fire('element.changed', {
      element: bandShape
    });
  });

  // redraw the actual activity as well
  this._eventBus.fire('element.changed', {
    element: activityShape
  });
};

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

  this.updateAllBandShapes(context);
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

  if (isUndefined(index)) {
    index = getBandGapIndex(activityShape.bandShapes.length);
    context.index = index;
  }

  // if we have no existing band shape, we have to create one
  if (isUndefined(bandShape)) {
    // choose a participant for the new band
    let choreo = this._canvas.getRootElement();
    let participants = choreo.businessObject.participants;
    let participant;
    for (let i = 0; i < participants.length; i++) {
      if (!activity.participantRef.includes(participants[i])) {
        participant = participants[i];
        break;
      }
    }

    // if we found no participant, create a new one
    if (isUndefined(participant)) {
      participant = this._bpmnFactory.create('bpmn:Participant');
      participants.push(participant);
      participant.name = 'Participant ' + participants.length;
    }

    // create band shape
    let diBand = this._bpmnFactory.createDiShape(participant, {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }, {
      choreographyActivityShape: activity.di
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

  this.updateAllBandShapes(context);
};

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