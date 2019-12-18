import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  addPadding
} from 'diagram-js/lib/features/resize/ResizeUtil';

import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { getChildrenBBox } from '../../resize/ChoreoResizeUtil';
import { heightOfTopBands, heightOfBottomBands } from '../../../util/BandUtil';


var MID_PRIORITY = 1000;

/**
 * Revert is handled by bpmn-js/lib/features/modeling/behavior/ToggleElementCollapseBehavior.
 * @constructor
 * @param {Injector} injector
 * @param {EventBus} eventBus
 * @param {ElementFactory} elementFactory
 * @param {Modeling} modeling
 */
export default function ToggleChoreoCollapseBehaviour(injector, eventBus, elementFactory, modeling) {

  injector.invoke(CommandInterceptor, this);

  this.executed([ 'shape.toggleCollapse' ], MID_PRIORITY, function(e) {
    let context = e.context;
    let shape = context.shape;

    if (!is(shape, 'bpmn:SubChoreography')) {
      return;
    }

    // update business object
    getBusinessObject(shape).di.isExpanded = !shape.collapsed;

    // remember previous visibility of children
    let toToggle = getDescendantsToToggle(shape);
    context.oldDescendantsVisibility = getElementsVisibility(toToggle);
    setHidden(toToggle, shape.collapsed);

    if (!shape.collapsed) {
      // all children got made visible through djs, hide empty labels
      hideEmptyLables(shape.children);
    } else {
      // participant bands should still be visible
      showParticipantBands(shape.children);
    }

    // update toggled children
    toToggle.forEach(element => {
      eventBus.fire('element.changed', {
        element: element
      });
    });
  });

  this.reverted([ 'shape.toggleCollapse' ], MID_PRIORITY, function(e) {
    let context = e.context;
    let shape = context.shape;

    if (!is(shape, 'bpmn:SubChoreography')) {
      return;
    }

    // restore previous visibility
    let toToggle = getDescendantsToToggle(shape);
    restoreVisibility(toToggle, context.oldDescendantsVisibility);

    // update toggled children
    toToggle.forEach(element => {
      eventBus.fire('element.changed', {
        element: element
      });
    });
  });

  this.postExecuted([ 'shape.toggleCollapse' ], MID_PRIORITY, function(e) {
    let context = e.context;
    let shape = context.shape;
    let defaultSize = elementFactory._getDefaultSize(shape);
    let newBounds;

    if (shape.collapsed) {
      newBounds = collapsedBounds(shape, defaultSize);
    } else {
      newBounds = expandedBounds(shape, defaultSize);
    }
    modeling.resizeShape(shape, newBounds);
  });
}

inherits(ToggleChoreoCollapseBehaviour, CommandInterceptor);

ToggleChoreoCollapseBehaviour.$inject = [
  'injector',
  'eventBus',
  'elementFactory',
  'modeling'
];

function showParticipantBands(children) {
  if (children) {
    children.forEach(child => {
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

function getDescendantsToToggle(shape) {
  let elements = [];

  let recurse = function(element) {
    // filter duplicates
    if (elements.includes(element)) {
      return;
    }

    // only toggle messages if they are supposed to be visible,
    // all other elements are toggled anyways
    if (!is(element, 'bpmn:Message') || element.parent.diBand.isMessageVisible) {
      elements.push(element);
    }

    // recurse into all children if this element is not collapsed, otherwise
    // only recurse into participant bands
    if (element.children) {
      element.children.forEach(child => {
        if (is(child, 'bpmn:Participant') || !element.collapsed) {
          recurse(child);
        }
      });
    }
  };
  shape.children.forEach(recurse);

  // remove elements that are direct children of the shape or the shape itself,
  // the handler in diagram-js takes care of these
  elements = elements.filter(element => element !== shape && !shape.children.includes(element));
  return elements;
}

function expandedBounds(shape, defaultSize) {
  let bounds = getChildrenBBox(shape);
  if (bounds) {
    bounds = addPadding(bounds, {
      left: 0,
      right: 0,
      top: heightOfTopBands(shape),
      bottom: heightOfBottomBands(shape)
    });
    bounds = addPadding(bounds, 20);
    return bounds;
  } else {
    return {
      x: shape.x + (shape.width - defaultSize.width) / 2,
      y: shape.y + (shape.height - defaultSize.height) / 2,
      width: defaultSize.width,
      height: defaultSize.height
    };
  }
}

function collapsedBounds(shape, defaultSize) {
  let newHeight = defaultSize.height + heightOfTopBands(shape) + heightOfBottomBands(shape);
  return {
    x: shape.x + (shape.width - defaultSize.width) / 2,
    y: shape.y + (shape.height - newHeight) / 2,
    width: defaultSize.width,
    height: newHeight
  };
}

function getElementsVisibility(elements) {
  let result = {};
  elements.forEach(element => {
    result[element.id] = element.hidden;
  });
  return result;
}

function setHidden(elements, newHidden) {
  elements.forEach(element => {
    element.hidden = newHidden;
  });
}

function restoreVisibility(elements, lastState) {
  elements.forEach(element => {
    element.hidden = lastState[element.id];
  });
}