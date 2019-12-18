import {
  getBandGapIndex
} from '../../../util/BandUtil';

import {
  assign
} from 'min-dash';

import {
  getAttachedMessageBounds
} from '../../../util/MessageUtil';

/**
 * Command handler that fires on `band.swap` and moves participant bands
 * up or down within their choreography activity.
 * @constructor
 */
export default function SwapParticipantBandHandler() { }

SwapParticipantBandHandler.$inject = [];

SwapParticipantBandHandler.prototype.moveBand = function(activityShape, bandShape, upwards) {
  // get some important values
  let bandShapes = activityShape.bandShapes;
  let bandCount = bandShapes.length;
  let index = activityShape.bandShapes.findIndex(x => x === bandShape);
  let gapIndex = getBandGapIndex(bandCount);

  // check if this move is allowed
  if ((upwards && index <= 0) || (!upwards && index >= bandCount - 1)) {
    return;
  }

  // swap the bands if we are moving downwards so we always move upwards
  if (!upwards) {
    upwards = true;
    index++;
    bandShape = bandShapes[index];
  }
  let swapBandShape = bandShapes[index - 1];

  // swap shapes in original array
  bandShapes[index] = swapBandShape;
  bandShapes[index - 1] = bandShape;

  // swap participants in the business object
  let participantRef = activityShape.businessObject.participantRef;
  let swapParticipant = participantRef[index];
  participantRef[index] = participantRef[index - 1];
  participantRef[index - 1] = swapParticipant;

  // calculate the new y coordinate of the two shapes
  let newY = swapBandShape.y;
  let swapNewY;
  if (index == gapIndex) {
    swapNewY = bandShape.y + bandShape.height - swapBandShape.height;
  } else {
    swapNewY = swapBandShape.y + bandShape.height;
  }

  // update the y coordinates in all relevant places
  bandShape.y = newY;
  swapBandShape.y = swapNewY;
  bandShape.diBand.bounds.y = newY;
  swapBandShape.diBand.bounds.y = swapNewY;

  // "swap" the participant band kinds without touching the (non)-initiating part,
  // i.e., everything after the first dash
  let bandKind = bandShape.diBand.participantBandKind;
  let swapBandKind = swapBandShape.diBand.participantBandKind;
  let bandKindIndex = bandKind.indexOf('_');
  let swapBandKindIndex = swapBandKind.indexOf('_');
  bandShape.diBand.participantBandKind = swapBandKind.slice(0, swapBandKindIndex) + bandKind.slice(bandKindIndex);
  swapBandShape.diBand.participantBandKind = bandKind.slice(0, bandKindIndex) + swapBandKind.slice(swapBandKindIndex);

  // reposition messages if necessary
  bandShape.children.forEach(message => {
    assign(message, getAttachedMessageBounds(bandShape));
  });
  swapBandShape.children.forEach(message => {
    assign(message, getAttachedMessageBounds(swapBandShape));
  });

  // mark all relevant shapes as dirty
  return [bandShape, swapBandShape, activityShape]
    .concat(bandShape.children)
    .concat(swapBandShape.children);
};

SwapParticipantBandHandler.prototype.execute = function(context) {
  return this.moveBand(context.activityShape, context.bandShape, context.upwards);
};

SwapParticipantBandHandler.prototype.revert = function(context) {
  return this.moveBand(context.activityShape, context.bandShape, !context.upwards);
};