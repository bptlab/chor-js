export function resizeBands(taskShape, oldBounds, newBounds) {
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
  });

  // move bottom bands down
  let deltaBottom = (newBounds.height - oldBounds.height) + deltaTop;
  bottomShapes.forEach(shape => {
    shape.y += deltaBottom;
  })
}