import { getMessageShape } from '../../util/MessageUtil';
import { getBBox } from 'diagram-js/lib/util/Elements';
import { is } from 'bpmn-js/lib/util/ModelUtil';

export function getChildrenBBox(shape) {
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

    // exclude hidden shapes
    if (child.hidden) {
      return false;
    }

    return true;
  });

  // add messages
  let messages = [];
  children.forEach(outer => {
    if (is(outer, 'bpmn:ChoreographyTask')) {
      outer.children.forEach(inner => {
        if (is(inner, 'bpmn:Participant')) {
          let messageShape = getMessageShape(inner);
          if (messageShape && !messageShape.hidden) {
            messages.push(messageShape);
          }
        }
      });
    }
  });
  children = children.concat(messages);

  // calculate the bounding box
  if (children.length > 0) {
    return getBBox(children);
  }
}