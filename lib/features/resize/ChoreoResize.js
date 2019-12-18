import inherits from 'inherits';

import Resize from 'diagram-js/lib/features/resize/Resize';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { getMinResizeBounds, addPadding } from 'diagram-js/lib/features/resize/ResizeUtil';
import { heightOfTopBands, heightOfBottomBands } from '../../util/BandUtil';
import { getChildrenBBox } from './ChoreoResizeUtil';

/**
 * @param {Injector} injector
 * @constructor
 */
export default function ChoreoResize(injector) {
  injector.invoke(Resize, this);
}

inherits(ChoreoResize, Resize);

ChoreoResize.$inject = [
  'injector'
];

ChoreoResize.prototype.computeMinResizeBox = function(context) {
  let shape = context.shape;
  let direction = context.direction;
  let minDimensions;

  if (is(shape, 'bpmn:ChoreographyActivity')) {
    let topBandsHeight = heightOfTopBands(shape);
    let bottomBandsHeight = heightOfBottomBands(shape);

    minDimensions = context.minDimensions || {
      width: 100,
      height: topBandsHeight + bottomBandsHeight + 40
    };

    // get children we want to factor in in determining the bounds (only when not collapsed)
    let childrenBounds;
    if (!shape.collapsed) {
      childrenBounds = getChildrenBBox(shape);
      if (childrenBounds) {
        // add padding from context
        childrenBounds = addPadding(childrenBounds, context.childrenBoxPadding);

        // add padding for the bands
        childrenBounds = addPadding(childrenBounds, {
          left: 0,
          right: 0,
          top: heightOfTopBands(shape),
          bottom: heightOfBottomBands(shape)
        });
      }
    }

    return getMinResizeBounds(direction, shape, minDimensions, childrenBounds);
  }
  return Resize.prototype.computeMinResizeBox.call(this, context);
};