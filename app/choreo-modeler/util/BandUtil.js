const BAND_HEIGHT = 20;

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
 * Moves and resizes the participant bands of a choreography activity
 * according to the activity's bounds. Updates both the shapes as well
 * as the underlying DI objects.
 *
 * @param {Object} taskShape shape object of the choreography activity
 * @param {Object} oldBounds old bounds of the choreography activity
 * @param {Object} newBounds new bounds of the choreography activity
 */
export function resizeBands(taskShape, oldBounds, newBounds) {
  let bandShapes = taskShape.bandShapes;

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

export function heightOfBottomBands(taskShape) {
  const bottomBands = sortedBands.slice(getGapIndex(taskShape.bandShapes.length));
  const totalHeight = bottomBands.reduce((sum, band) => sum + band.bounds.height, 0);
  return totalHeight;
}