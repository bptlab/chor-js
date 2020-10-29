import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { getBandGapIndex } from '../../../util/BandUtil';
import { assign } from 'min-dash';
import { getMessageShape, getAttachedMessageBounds } from '../../../util/MessageUtil';
import { delta as calculateDelta } from 'diagram-js/lib/util/PositionUtil';

/**
 *
 * @param {Injector} injector
 * @param {Modeling} modeling
 * @constructor
 */
export default function ResizeParticipantBandBehavior(injector, modeling) {
  injector.invoke(CommandInterceptor, this);

  this.executed('shape.resize', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Participant')) {
      assign(shape.diBand.bounds, context.newBounds);
    }
  });

  this.reverted('shape.resize', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Participant')) {
      assign(shape.diBand.bounds, context.newBounds);
    }
  });

  this.postExecute('shape.resize', function(event) {
    let context = event.context;
    let shape = context.shape;
    let newBounds = context.newBounds;
    let oldBounds = context.oldBounds;

    if (is(shape, 'bpmn:ChoreographyActivity')) {
      const delta = {
        x: newBounds.x - oldBounds.x,
        y: newBounds.y - oldBounds.y,
      };
      let verticalGrowth = newBounds.height - oldBounds.height;
      let gapIndex = getBandGapIndex(shape.bandShapes.length);
      shape.bandShapes.forEach((bandShape, index) => {
        let isBottomBand = index >= gapIndex;
        modeling.resizeShape(bandShape, {
          x: newBounds.x,
          y: bandShape.y + delta.y + (isBottomBand ? verticalGrowth : 0),
          width: newBounds.width,
          height: bandShape.height
        });

        let messageShape = getMessageShape(bandShape);
        if (messageShape) {
          const messageDelta = calculateDelta(getAttachedMessageBounds(bandShape), messageShape);
          modeling.moveShape(messageShape, messageDelta);
        }
      });
    }
  });
}

ResizeParticipantBandBehavior.$inject = [
  'injector',
  'modeling'
];

inherits(ResizeParticipantBandBehavior, CommandInterceptor);
