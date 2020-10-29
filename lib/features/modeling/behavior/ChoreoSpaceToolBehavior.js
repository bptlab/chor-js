import { forEach } from 'min-dash';
import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function ChoreoSpaceToolBehavior(eventBus, resize) {
  // This overwrites an event listener in SpaceToolBehavior in BpmnJS (due to the higher priority).
  // We need to set a different minSize for participants as BpmnJS has the sizes for lanes.
  // We also add minDimensions for ChoreoActivities.
  eventBus.on('spaceTool.getMinDimensions', 3000, function(context) {
    const shapes = context.shapes;
    const minDimensions = {};

    forEach(shapes, function(shape) {
      const id = shape.id;
      if (is(shape, 'bpmn:ChoreographyActivity')) {
        minDimensions[ id ] = resize.computeMinResizeBox({ shape: shape, direction: context.direction });
      }
      if (is(shape, 'bpmn:Participant')) {
        minDimensions[ id ] = { width: 0, height: 0 };
      }
    });

    return minDimensions;
  });
}

ChoreoSpaceToolBehavior.$inject = [
  'eventBus',
  'resize'
];
