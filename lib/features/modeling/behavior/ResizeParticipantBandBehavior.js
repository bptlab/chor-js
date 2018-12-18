import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import { getBandGapIndex } from '../../../util/BandUtil';
import { assign } from 'min-dash';


export default function ResizeParticipantBandBehavior(eventBus, modeling) {

  CommandInterceptor.call(this, eventBus);

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
      let delta = {
        x: newBounds.x - oldBounds.x,
        y: newBounds.y - oldBounds.y,
      };
      let verticalGrowth = newBounds.height - oldBounds.height;
      let gapIndex = getBandGapIndex(shape.bandShapes.length);
      shape.bandShapes.forEach((child, index) => {
        let isBottomBand = index >= gapIndex;
        modeling.resizeShape(child, {
          x: newBounds.x,
          y: child.y + delta.y + (isBottomBand ? verticalGrowth : 0),
          width: newBounds.width,
          height: child.height
        });
      });
    }
  });
}

ResizeParticipantBandBehavior.$inject = [
  'eventBus',
  'modeling'
];

inherits(ResizeParticipantBandBehavior, CommandInterceptor);