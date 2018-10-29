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
  bandShapes.sort((a, b) => {
    return a.y > b.y;
  });

  // all bands' widths needs to be adapted
  bandShapes.forEach(bandShape => {
    bandShape.x = newBounds.x;
    bandShape.width = newBounds.width;
    bandShape.diBand.bounds.x = newBounds.x;
    bandShape.diBand.bounds.width = newBounds.width;
  });

  // find the break in the bands, i.e., split them in top and bottom bands
  let maxGap = 0;
  let breakIndex = 1;
  for (let i = 0; i < bandShapes.length - 1; i++) {
    let gap = bandShapes[i + 1].y - bandShapes[i].y;
    if (gap > maxGap) {
      maxGap = gap;
      breakIndex = i + 1;
    }
  }
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
  })
}