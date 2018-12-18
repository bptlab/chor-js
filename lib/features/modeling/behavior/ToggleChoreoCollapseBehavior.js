import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  computeChildrenBBox
} from 'diagram-js/lib/features/resize/ResizeUtil';

import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { pick } from 'min-dash';


var MID_PRIORITY = 1000;

/**
 * Revert is handled by bpmn-js/lib/features/modeling/behavior/ToggleElementCollapseBehavior.
 */
export default function ToggleChoreoCollapseBehaviour(
    eventBus, elementFactory, modeling,
    resize) {

  CommandInterceptor.call(this, eventBus);

  function showParticipantBands(children) {
    if (children.length) {
      children.forEach(function(child) {
        if (is(child, 'bpmn:Participant')) {
          child.hidden = false;
        }
      });
    }
  }

  function hideEmptyLables(children) {
    if (children.length) {
      children.forEach(function(child) {
        if (child.type === 'label' && !child.businessObject.name) {
          child.hidden = true;
        }
      });
    }
  }

  function expandedBounds(shape, defaultSize) {
    var children = shape.children,
        newBounds = defaultSize,
        visibleElements,
        visibleBBox;

    visibleElements = children.filter(e => !e.hidden).concat([ shape ]);

    visibleBBox = computeChildrenBBox(visibleElements);

    if (visibleBBox) {
      // center to visibleBBox with max(defaultSize, childrenBounds)
      newBounds.width = Math.max(visibleBBox.width, newBounds.width);
      newBounds.height = Math.max(visibleBBox.height, newBounds.height);

      newBounds.x = visibleBBox.x + (visibleBBox.width - newBounds.width) / 2;
      newBounds.y = visibleBBox.y + (visibleBBox.height - newBounds.height) / 2;
    } else {
      // center to collapsed shape with defaultSize
      newBounds.x = shape.x + (shape.width - newBounds.width) / 2;
      newBounds.y = shape.y + (shape.height - newBounds.height) / 2;
    }

    return newBounds;
  }

  function collapsedBounds(shape, defaultSize) {
    return {
      x: shape.x + (shape.width - defaultSize.width) / 2,
      y: shape.y + (shape.height - defaultSize.height) / 2,
      width: defaultSize.width,
      height: defaultSize.height
    };
  }

  this.preExecute([ 'shape.toggleCollapse' ], MID_PRIORITY, function(e) {
    let context = e.context;
    let shape = context.shape;

    console.log('preExecute', e);
    if (shape.children) {
      shape.children.forEach(child => {
        if (!child.hidden) {
          if (!child.children) {
            child.children = [];
          }
          modeling.toggleCollapse(child);
        }
      });
    }

    // if (!shape.collapsed) {
    //   context.oldExpandedBounds = pick(shape, ['x', 'y', 'width', 'height']);
    // }
  });

  this.executed([ 'shape.toggleCollapse' ], MID_PRIORITY, function(e) {
    let context = e.context;
    let shape = context.shape;

    console.log('executed', e);
    if (!is(shape, 'bpmn:SubChoreography')) {
      return;
    }

    if (!shape.collapsed) {
      // all children got made visible through djs, hide empty labels
      hideEmptyLables(shape.children);

      getBusinessObject(shape).di.isExpanded = true;
    } else {
      // participant bands should still be visible
      showParticipantBands(shape.children);

      getBusinessObject(shape).di.isExpanded = false;
    }
  });

  this.postExecuted([ 'shape.toggleCollapse' ], MID_PRIORITY, function(e) {
    let context = e.context;
    let shape = context.shape;
    let defaultSize = elementFactory._getDefaultSize(shape);
    let newBounds;

    console.log('postExecuted', e);
    if (shape.collapsed) {
      // TODO include participant bands
      newBounds = collapsedBounds(shape, defaultSize);
    } else {
      newBounds = expandedBounds(shape, defaultSize);
    }
    modeling.resizeShape(shape, newBounds);

    // stop event bubbling
    return true;
  });
}

inherits(ToggleChoreoCollapseBehaviour, CommandInterceptor);

ToggleChoreoCollapseBehaviour.$inject = [
  'eventBus',
  'elementFactory',
  'modeling'
];