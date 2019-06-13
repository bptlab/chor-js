import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Get connected elements
 * @param shape The shape to start from
 * @param direction 'incoming' || 'outgoing' if to check connected shapes from incoming or outgoing
 * @param hasRequiredType {function} function to determine type of connected elements
 * @returns {Array}
 */
export function getConnectedElements(shape, direction, hasRequiredType) {
  if (direction !== 'incoming' && direction !== 'outgoing') {
    // This would currently reload the page due to debounce perhaps?
    throw new Error('Illegal Argument: ' + direction);
  }
  if (is(shape, 'bpmn:Participant')) {
    shape = shape.parent;
  }

  if (!is(shape, 'bpmn:FlowNode')) {
    return [];
  }

  let visited = [];
  let connected = [];

  function track(nodeShape, direction) {
    const flowDirection = direction === 'incoming' ? 'source' : 'target';
    // avoid loops
    if (visited.includes(nodeShape)) {
      return;
    }
    visited.push(nodeShape);

    // add to connected if we have reached an activity
    if (shape !== nodeShape && hasRequiredType(nodeShape)) {
      connected.push(nodeShape);
      return;
    }

    // iterate through all incoming or outgoing sequence flows and
    // recurse into the sources or targets
    nodeShape[direction].forEach(flow => {
      track(flow[flowDirection], direction);
    });
  }

  track(shape, direction);
  return connected;
}

export function getParticipants(shape) {
  if (is(shape, 'bpmn:Participant')) {
    return [shape.businessObject];
  }

  if (is(shape, 'bpmn:ChoreographyActivity')) {
    return shape.bandShapes.map(bandShape => bandShape.businessObject);
  }

  return [];
}


/**
 * Checks if shape is an initiating band shape
 * @param shape
 * @returns {boolean}
 */
export function isInitiating(shape) {
  if (is(shape, 'bpmn:Participant') && shape.diBand) {
    return !shape.diBand.participantBandKind.endsWith('non_initiating');
  }
  return false;
}

export function getInitiatingParticipants(shapes) {
  return flat(shapes.filter(s => isChoreoActivity(s))
    .map(act => act.bandShapes)).filter(part => isInitiating(part));
}

export function isChoreoActivity(shape) {
  return is(shape, 'bpmn:ChoreographyActivity');
}

/**
 *
 * @param shape
 * @param listOfTypes {Array}
 */
export function isAnyOf(shape, listOfTypes){
  return listOfTypes.some(type => is(shape, type))
}

export function participatesIn(participant, shape) {
  return getParticipants(shape).includes(participant);
}

/**
 * Stand-in function for flattening a array of depth 1.
 * @param {Array} array
 * @returns {Array}
 */
export function flat(array) {
  // Todo: Replace this with the real flat or flatMap when we have an updated
  // build pipeline which allows polyfills.
  return array.reduce((acc, value) => acc.concat(value), []);
}