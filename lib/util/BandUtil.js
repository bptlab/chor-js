import { is } from 'bpmn-js/lib/util/ModelUtil';
import { assign } from 'min-dash';

import IdGenerator from 'diagram-js/lib/util/IdGenerator';

const BAND_HEIGHT = 20;

export let idGenerator = new IdGenerator('ParticipantBand');

export function getBandHeight(participant) {
  return hasBandMarker(participant) ? Math.floor(1.8 * BAND_HEIGHT) : BAND_HEIGHT;
}

export function hasBandMarker(participant) {
  let multiplicity = participant.participantMultiplicity;
  return multiplicity && multiplicity.maximum > 1;
}

export function getBandGapIndex(n) {
  return Math.ceil(n / 2);
}

/**
 * Resets and recalculates the bounds and other properties of the participant bands
 * of an activity *on a DI level*, not on shapes.
 *
 * @param {Object} activity activity business object
 * @param {Array<Object>} diBands array of all band DIs attached to the activity
 * @param {Object} bounds bounds to fit the bands in
 */
export function resetAllBands(activity, diBands, bounds) {
  // set the bounds (except for y) for each band
  diBands.forEach(diBand => {
    diBand.bounds = assign(diBand.bounds, {
      x: bounds.x,
      width: bounds.width,
      height: getBandHeight(diBand.bpmnElement)
    });
  });

  // then, set the y position for all top bands
  for (let offset = 0, i = 0; i < getBandGapIndex(diBands.length); i++) {
    diBands[i].bounds.y = bounds.y + offset;
    offset += diBands[i].bounds.height;
  }

  // then, set the y position for all bottom bands
  for (let offset = 0, i = diBands.length - 1; i >= getBandGapIndex(diBands.length); i--) {
    offset += diBands[i].bounds.height;
    diBands[i].bounds.y = bounds.y + bounds.height - offset;
  }

  // update the participant band kind of all bands
  diBands.forEach((diBand, index) => {
    let bandKind;
    if (index == 0) {
      bandKind = 'top_';
    } else if (index == diBands.length - 1) {
      bandKind = 'bottom_';
    } else {
      bandKind = 'middle_';
    }
    if (diBand.bpmnElement === activity.initiatingParticipantRef) {
      bandKind += 'initiating';
    } else {
      bandKind += 'non_initiating';
    }
    diBand.participantBandKind = bandKind;
  });

  // messages can only be visible for choreography tasks
  if (!is(activity, 'bpmn:ChoreographyTask')) {
    diBands.forEach(diBand => {
      diBand.isMessageVisible = false;
    });
  }
}

/**
 * Moves and resizes the participant bands of a choreography activity
 * according to the activity's bounds. Updates both the shapes as well
 * as the underlying DI objects.
 *
 * @param {Object} activityShape shape object of the choreography activity
 * @param {Object} oldBounds old bounds of the choreography activity
 * @param {Object} newBounds new bounds of the choreography activity
 */
export function resizeBands(activityShape, oldBounds, newBounds) {
  let bandShapes = activityShape.bandShapes;

  // all bands' widths needs to be adapted
  bandShapes.forEach(bandShape => {
    bandShape.x = newBounds.x;
    bandShape.width = newBounds.width;
    bandShape.diBand.bounds.x = newBounds.x;
    bandShape.diBand.bounds.width = newBounds.width;
  });

  let gapIndex = getBandGapIndex(bandShapes.length);
  let topShapes = bandShapes.slice(0, gapIndex);
  let bottomShapes = bandShapes.slice(gapIndex);

  // move top bands up
  let deltaTop = newBounds.y - oldBounds.y;
  topShapes.forEach(shape => {
    shape.y += deltaTop;
    shape.diBand.bounds.y = shape.y;
  });

  // move bottom bands down
  let deltaBottom = (newBounds.height - oldBounds.height) + deltaTop;
  bottomShapes.forEach(shape => {
    shape.y += deltaBottom;
    shape.diBand.bounds.y = shape.y;
  });
}

export function heightOfTopBands(activityShape) {
  // Calculate using the participants directly because when this method is called
  // the participant bands might not have been created yet.
  let participants = activityShape.businessObject.participantRef || [];
  let totalHeight = 0;
  for (let i = 0; i < getBandGapIndex(participants.length); i++) {
    totalHeight += getBandHeight(participants[i]);
  }
  return totalHeight;
}

export function heightOfBottomBands(activityShape) {
  // Calculate using the participants directly because when this method is called
  // the participant bands might not have been created yet.
  let participants = activityShape.businessObject.participantRef || [];
  let totalHeight = 0;
  for (let i = getBandGapIndex(participants.length); i < participants.length; i++) {
    totalHeight += getBandHeight(participants[i]);
  }
  return totalHeight;
}