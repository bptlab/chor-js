const BAND_HEIGHT = 20;

function getGapIndex(taskShape) {
  return Math.floor(taskShape.bandShapes.length / 2) + 1;
}

function getBandHeight(bandShape) {
  return hasBandMarker(band) ? (2 * BAND_HEIGHT) : BAND_HEIGHT;
}

export function hasBandMarker(bandShape) {
  let multiplicity = bandShape.businessObject.participantMultiplicity;
  return multiplicity && multiplicity.maximum > 1;
}

/**
 * Return the bounds of the n-th participant band of the given choreography activity.
 * The bands are numbered from top to bottom.
 *
 * /---\
 *   0
 *   1
 *
 *  ...
 *
 *  n-1
 *   n
 * \---/
 *
 * @param {Object} taskShape shape of the choreo activity
 * @param {Number} bandIndex index of the band
 */
export function calculateBandBounds(taskShape, bandIndex) {
  let bandShapes = taskShape.bandShapes;
  let band = bandShapes[bandIndex];
  let offset = 0;
  if (bandIndex < getGapIndex(taskShape)) {
    for (let i = 0; i < bandIndex; i++) {
      offset += getBandHeight(bandShapes[i]);
    }
  } else {
    offset = taskShape.height;
    for (let i = bandShapes.length - 1; i >= bandIndex; i--) {
      offset -= getBandHeight(bandShapes[i]);
    }
  }
  return {
    x: taskShape.x,
    y: taskShape.y + offset,
    width: taskShape.width,
    height: getBandHeight(band)
  }
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

  let breakIndex = getGapIndex(taskShape);
  let topShapes = bandShapes.slice(0, breakIndex);
  let bottomShapes = bandShapes.slice(breakIndex);

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
  const bottomBands = sortedBands.slice(getGapIndex(taskShape));
  const totalHeight = bottomBands.reduce((sum, band) => sum + band.bounds.height, 0);
  return totalHeight;
}