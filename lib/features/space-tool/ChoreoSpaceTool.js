import SpaceTool from 'diagram-js/lib/features/space-tool/SpaceTool';
import inherits from 'inherits';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { filter, forEach, isNumber, assign } from 'min-dash';
import { asTRBL } from 'diagram-js/lib/layout/LayoutUtil';

import { getBBox } from 'diagram-js/lib/util/Elements';

import { getDirection } from 'diagram-js/lib/features/space-tool/SpaceUtil';

import { hasPrimaryModifier } from 'diagram-js/lib/util/Mouse';

import { set as setCursor } from 'diagram-js/lib/util/Cursor';

import { selfAndAllChildren } from 'diagram-js/lib/util/Elements';

const abs = Math.abs;


const AXIS_TO_DIMENSION = {
  x: 'width',
  y: 'height'
};

/**
 * Add or remove space by moving and resizing elements. This module overwrites the SpaceTool from DiagramJS.
 * Specifically, we overwrite the #init function and creat a new #getSpaceToolConstraints method to make an
 * exception for participants and messages.
 * Most lines are copied from Diagram-js v6.6.1, #getSpaceToolConstraints is not exposed via the prototype, thus
 * it needs to be copied and changed. It gets confused with the participant bands and messages, as they are scaled when the
 * activity is scaled, which is obviously not taken into account by the original bpmn-js solution.
 *
 * @param injector {Injector}
 * @param canvas {Canvas}
 * @param eventBus {EventBus}
 */
export default function ChoreoSpaceTool(injector, canvas, eventBus) {
  injector.invoke(SpaceTool, this);
  this._canvas = canvas;
  this._eventBus = eventBus;
}

inherits(ChoreoSpaceTool, SpaceTool);

ChoreoSpaceTool.$inject = [
  'injector',
  'canvas',
  'eventBus'
];

function isConnection(element) {
  return !!element.waypoints;
}

/**
 * This method filters out and adds any messages and bands that will clash with the resizing an moving behavior otherwise
 * implemented by chor-js.
 * @param elements
 * @returns elements
 */
ChoreoSpaceTool.prototype.manageChoreoSpecificMovementsAndResizes = function(elements) {
  elements.resizingShapes = elements.resizingShapes || [];
  elements.movingShapes = elements.movingShapes || [];
  // ResizeParticipantBandBehavior implements the logic for resizing and moving participant bands and messages
  // on activity resize. Thus, we have to prevent the SpaceTool from resizing participants and messages or else
  // this will be done twice.
  elements.resizingShapes = elements.resizingShapes.filter(s => !is(s, 'bpmn:Participant') && !is(s, 'bpmn:Message'));

  elements.movingShapes = elements.movingShapes.filter(s => {
    // As the ResizeParticipantBandBehavior also moves participant bands vertically if the activity is resized vertically we have
    // to remove participant bands from the movingShapes iff their activity is resized.
    // However, if they are moved horizontally or vertically and the activity is not resized the bands still need to be moved
    if (is(s, 'bpmn:Participant')) {
      return !elements.resizingShapes.includes(s.activityShape);
    }
    // We also remove all Messages here so they cannot be moved individually. We will add the messages that are actually
    // moved later.
    return !is(s, 'bpmn:Message');

  });

  // We add all messages that should move. I.e., the messages whose band moves.
  const alsoMovingMessages = [];
  elements.movingShapes.forEach(s => {
    if (is(s, 'bpmn:Participant')) {
      s.children.forEach(c => {
        if (!elements.movingShapes.includes(c)) {
          alsoMovingMessages.push(c);
        }
      });
    }
  });

  elements.movingShapes = elements.movingShapes.concat(alsoMovingMessages);
  return elements;
};


/**
 * Initialize make space and return true if that was successful.
 *
 * @param {Object} event
 * @param {Object} context
 *
 * @return {boolean}
 */
ChoreoSpaceTool.prototype.init = function(event, context) {
  const axis = abs(event.dx) > abs(event.dy) ? 'x' : 'y';
  let delta = event[ 'd' + axis ];
  const start = event[ axis ] - delta;

  if (abs(delta) < 5) {
    return false;
  }

  // invert delta to remove space when moving left
  if (delta < 0) {
    delta *= -1;
  }

  // invert delta to add/remove space when removing/adding space if modifier key is pressed
  if (hasPrimaryModifier(event)) {
    delta *= -1;
  }

  const direction = getDirection(axis, delta);

  const root = this._canvas.getRootElement();

  const children = selfAndAllChildren(root, true);

  let elements = this.calculateAdjustments(children, axis, delta, start);

  const minDimensions = this._eventBus.fire('spaceTool.getMinDimensions', {
    axis: axis,
    direction: direction,
    shapes: elements.resizingShapes,
    start: start
  });

  const spaceToolConstraints = this.getSpaceToolConstraints(elements, axis, direction, start, minDimensions);
  elements = this.manageChoreoSpecificMovementsAndResizes(elements);

  assign(
    context,
    elements,
    {
      axis: axis,
      direction: direction,
      spaceToolConstraints: spaceToolConstraints,
      start: start
    }
  );

  setCursor('resize-' + (axis === 'x' ? 'ew' : 'ns'));

  return true;
};

var DIRECTION_TO_TRBL = {
  n: 'top',
  w: 'left',
  s: 'bottom',
  e: 'right'
};


var DIRECTION_TO_OPPOSITE = {
  n: 's',
  w: 'e',
  s: 'n',
  e: 'w'
};

var PADDING = 20;

function addPadding(trbl) {
  return {
    top: trbl.top - PADDING,
    right: trbl.right + PADDING,
    bottom: trbl.bottom + PADDING,
    left: trbl.left - PADDING
  };
}

/**
 * This methods was mostly copied from Diagram-js v.6.6.1 because it is unfortunately not overwritable.
 * It hast to make exceptions for participants and messages, or else the constraint logic breaks.
 * @param elements
 * @param axis
 * @param direction
 * @param start
 * @param minDimensions
 * @returns {Object} the constraints object
 */
ChoreoSpaceTool.prototype.getSpaceToolConstraints = function(elements, axis, direction, start, minDimensions) {
  const movingShapes = elements.movingShapes;
  const resizingShapes = elements.resizingShapes;

  if (!resizingShapes.length) {
    return;
  }

  const spaceToolConstraints = {};
  let min;
  let max;

  forEach(resizingShapes, function(resizingShape) {
    const resizingShapeBBox = asTRBL(resizingShape);

    // find children that are not moving or resizing
    const nonMovingResizingChildren = filter(resizingShape.children, function(child) {
      return !isConnection(child) &&
        !isLabel(child) &&
        !includes(movingShapes, child) &&
        !includes(resizingShapes, child) &&
        !is(child, 'bpmn:Participant') && // We need to skip participants and messages as they will move and scale when the activity moves or scales
        !is(child, 'bpmn:Message');
    });

    // find children that are moving
    const movingChildren = filter(resizingShape.children, function(child) {
      return !isConnection(child) && !isLabel(child) && includes(movingShapes, child);
    });

    let minOrMax;
    let nonMovingResizingChildrenBBox;
    let movingChildrenBBox;

    if (nonMovingResizingChildren.length) {
      nonMovingResizingChildrenBBox = addPadding(asTRBL(getBBox(nonMovingResizingChildren)));

      minOrMax = start -
        resizingShapeBBox[ DIRECTION_TO_TRBL[ direction ] ] +
        nonMovingResizingChildrenBBox[ DIRECTION_TO_TRBL[ direction ] ];

      if (direction === 'n') {
        spaceToolConstraints.bottom = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 'w') {
        spaceToolConstraints.right = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 's') {
        spaceToolConstraints.top = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      } else if (direction === 'e') {
        spaceToolConstraints.left = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      }
    }

    if (movingChildren.length) {
      movingChildrenBBox = addPadding(asTRBL(getBBox(movingChildren)));

      minOrMax = start -
        movingChildrenBBox[ DIRECTION_TO_TRBL[ DIRECTION_TO_OPPOSITE[ direction ] ] ] +
        resizingShapeBBox[ DIRECTION_TO_TRBL[ DIRECTION_TO_OPPOSITE[ direction ] ] ];

      if (direction === 'n') {
        spaceToolConstraints.bottom = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 'w') {
        spaceToolConstraints.right = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 's') {
        spaceToolConstraints.top = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      } else if (direction === 'e') {
        spaceToolConstraints.left = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      }
    }

    const resizingShapeMinDimensions = minDimensions && minDimensions[ resizingShape.id ];

    if (resizingShapeMinDimensions) {
      if (direction === 'n') {
        minOrMax = start +
          resizingShape[ AXIS_TO_DIMENSION [ axis ] ] -
          resizingShapeMinDimensions[ AXIS_TO_DIMENSION[ axis ] ];

        spaceToolConstraints.bottom = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 'w') {
        minOrMax = start +
          resizingShape[ AXIS_TO_DIMENSION [ axis ] ] -
          resizingShapeMinDimensions[ AXIS_TO_DIMENSION[ axis ] ];

        spaceToolConstraints.right = max = isNumber(max) ? Math.min(max, minOrMax) : minOrMax;
      } else if (direction === 's') {
        minOrMax = start -
          resizingShape[ AXIS_TO_DIMENSION [ axis ] ] +
          resizingShapeMinDimensions[ AXIS_TO_DIMENSION[ axis ] ];

        spaceToolConstraints.top = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      } else if (direction === 'e') {
        minOrMax = start -
          resizingShape[ AXIS_TO_DIMENSION [ axis ] ] +
          resizingShapeMinDimensions[ AXIS_TO_DIMENSION[ axis ] ];

        spaceToolConstraints.left = min = isNumber(min) ? Math.max(min, minOrMax) : minOrMax;
      }
    }
  });

  return spaceToolConstraints;
};

function includes(array, item) {
  return array.indexOf(item) !== -1;
}

function isLabel(element) {
  return !!element.labelTarget;
}
