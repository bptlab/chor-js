import inherits from 'inherits';

import Resize from 'diagram-js/lib/features/resize/Resize';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { getMinResizeBounds, addPadding } from 'diagram-js/lib/features/resize/ResizeUtil';
import { getBBox } from 'diagram-js/lib/util/Elements';
import { heightOfTopBands, heightOfBottomBands } from '../../util/BandUtil';

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
      height: topBandsHeight + bottomBandsHeight + 50
    };

    // get children we want to factor in in determining the bounds
    // TODO include messages
    let children = shape.children.filter(child => {
      // exclude connections
      if (child.waypoints) {
        return false;
      }

      // exclude labels
      if (child.type === 'label') {
        return false;
      }

      // exclude participant bands
      if (is(child, 'bpmn:Participant')) {
        return false;
      }

      return true;
    });

    // factor in the children bounds
    let childrenBounds;
    if (children.length > 0) {
      childrenBounds = getBBox(children);

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

    return getMinResizeBounds(direction, shape, minDimensions, childrenBounds);
  }
  return Resize.prototype.computeMinResizeBox.call(this, context);
};