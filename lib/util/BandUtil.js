import { is } from 'bpmn-js/lib/util/ModelUtil';
import { assign } from 'min-dash';

const BAND_HEIGHT = 20;

export function isInitiating(bandShape) {
  return bandShape.parent.businessObject.initiatingParticipantRef === bandShape.businessObject;
}

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

export function getBandKind(index, count, initiating) {
  let bandKind;
  if (index == 0) {
    bandKind = 'top_';
  } else if (index == count - 1) {
    bandKind = 'bottom_';
  } else {
    bandKind = 'middle_';
  }
  if (initiating) {
    bandKind += 'initiating';
  } else {
    bandKind += 'non_initiating';
  }
  return bandKind;
}

export function updateParticipantBandKinds(activity, diBands) {
  diBands.forEach((diBand, index) => {
    diBand.participantBandKind = getBandKind(index, diBands.length, diBand.bpmnElement === activity.initiatingParticipantRef);
  });
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
  updateParticipantBandKinds(activity, diBands);

  // messages can only be visible for choreography tasks
  if (!is(activity, 'bpmn:ChoreographyTask')) {
    diBands.forEach(diBand => {
      diBand.isMessageVisible = false;
    });
  }
}


/**
 * Moves and resizes the participant bands of a choreography activity
 * according to the activity's bounds or the changed band bounds.
 *
 * @param {Object} injector
 * @param {Object} activityShape shape object of the choreography activity
 */
export function updateBands(injector, activityShape) {
  let modeling = injector.get('modeling');

  let newBounds = activityShape.businessObject.di.bounds;
  let bandShapes = activityShape.bandShapes;

  let gapIndex = getBandGapIndex(bandShapes.length);
  let topShapes = bandShapes.slice(0, gapIndex);
  let bottomShapes = bandShapes.slice(gapIndex);

  let offsetTop = 0;
  topShapes.forEach(bandShape => {
    let bandHeight = getBandHeight(bandShape.businessObject);
    modeling.resizeShape(bandShape, {
      x: newBounds.x,
      y: newBounds.y + offsetTop,
      width: newBounds.width,
      height: bandHeight
    });
    offsetTop += bandHeight;
  });

  let offsetBottom = 0;
  bottomShapes.reverse().forEach(bandShape => {
    let bandHeight = getBandHeight(bandShape.businessObject);
    offsetBottom += bandHeight;
    modeling.resizeShape(bandShape, {
      x: newBounds.x,
      y: newBounds.y + newBounds.height - offsetBottom,
      width: newBounds.width,
      height: bandHeight
    });
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
