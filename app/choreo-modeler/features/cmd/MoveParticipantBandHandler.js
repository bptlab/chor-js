import {
  getBandGapIndex
} from '../../util/BandUtil';

/**
 * Command handler that fires on `band.move` and moves participant bands
 * up or down within their choreography activity.
 */
export default function MoveParticipantBandHandler(commandStack, elementRegistry, eventBus) {
  this._commandStack = commandStack;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
}

MoveParticipantBandHandler.$inject = [
  'commandStack',
  'elementRegistry',
  'eventBus'
];

MoveParticipantBandHandler.prototype.moveBand = function(activityShape, bandShape, upwards) {
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
    index++;
    bandShape = bandShapes[index];
  }
  let swapBandShape = bandShapes[index - 1];

  // swap shapes in original array
  bandShapes[index] = swapBandShape;
  bandShapes[index - 1] = bandShape;

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

  // notify other components (renderer, selection, ...) of the change
  this._eventBus.fire('element.changed', {
    element: bandShape
  });
  this._eventBus.fire('element.changed', {
    element: swapBandShape
  });
}

MoveParticipantBandHandler.prototype.execute = function(context) {
  this.moveBand(context.activityShape, context.bandShape, context.upwards);
}

MoveParticipantBandHandler.prototype.revert = function(context) {
  this.moveBand(context.activityShape, context.bandShape, !context.upwards);
}