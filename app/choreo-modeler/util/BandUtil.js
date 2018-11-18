const BAND_HEIGHT = 20;

/**
 * Find the gap in the bands, i.e., spliting them in top and bottom bands
 * @param bandShapes
 * @returns {number} Index of the first bandShape after the gap
 */
function findBandGapIndex(bandShapes) {
  let maxGap = 0;
  let breakIndex = 1;
  for (let i = 0; i < bandShapes.length - 1; i++) {
    let gap = bandShapes[i + 1].y - bandShapes[i].y;
    if (gap > maxGap) {
      maxGap = gap;
      breakIndex = i + 1;
    }
  }
  return breakIndex;
}

/**
 * Return the bounds of the n-th participant band
 * of the given choreography activity. The ordering is
 * alternating from top to bottom bands.
 *
 * /---\
 *   0
 *   2
 *
 *  ...
 *
 *   3
 *   1
 * \---/
 *
 * @param {Object} taskShape shape of the choreo activity
 * @param {Number} bandIndex index of the band
 */
export function getBandBounds(taskShape, bandIndex) {
  let offset = Math.ceil(bandIndex / 2) * BAND_HEIGHT;
  return {
    x: taskShape.x,
    y: taskShape.y + ((bandIndex % 2 == 0) ? offset : (taskShape.height - offset)),
    width: taskShape.width,
    height: BAND_HEIGHT
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
  // sort the bands by their y-coordinate
  let bandShapes = taskShape.bandShapes;
  bandShapes.sort((a, b) => a.y - b.y);

  // all bands' widths needs to be adapted
  bandShapes.forEach(bandShape => {
    bandShape.x = newBounds.x;
    bandShape.width = newBounds.width;
    bandShape.diBand.bounds.x = newBounds.x;
    bandShape.diBand.bounds.width = newBounds.width;
  });

  let breakIndex = findBandGapIndex(bandShapes);
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
  const sortedBands = taskShape.diBands.sort((a,b) => a.bounds.y - b.bounds.y);
  const gapIndex = findBandGapIndex(sortedBands.map(diBand => diBand.bounds));
  const bottomBands = sortedBands.slice(gapIndex);
  const totalHeight = bottomBands.reduce((sum, band) => sum + band.bounds.height, 0);
  return totalHeight;
}