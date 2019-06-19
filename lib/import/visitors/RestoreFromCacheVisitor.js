import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  isLabelExternal
} from 'bpmn-js/lib/util/LabelUtil';

/**
 * This visitor restores a choreography diagram from a cached list of shapes.
 *
 * @param {*} injector
 * @param {*} cache array of shaped to restore the diagram from
 */
export default function RestoreFromCacheVisitor(injector, cache) {
  this._injector = injector;
  this._canvas = injector.get('canvas');
  this._cache = cache;
}

RestoreFromCacheVisitor.prototype.init = function(choreo, diagram) {
};

RestoreFromCacheVisitor.prototype.visit = function(element, parentShape) {
  const shape = this.getShape(element, parentShape);

  if (!parentShape) {
    this._canvas.setRootElement(shape, true);
  } else {
    if (is(shape, 'bpmn:SequenceFlow') || is(shape, 'bpmn:Association')) {
      this._canvas.addConnection(shape, parentShape);
    } else {
      this._canvas.addShape(shape, parentShape);
    }

    // add label if necessary
    if (isLabelExternal(element) && element.name) {
      const label = this.getLabel(element);
      if (label) {
        this._canvas.addShape(label, parentShape);
      }
    }
  }

  return shape;
};

/**
 * Find the cached shape corresponding to a semantic element and a parent shape.
 * That is, we search for the cached shape that displays the given semantic element
 * and is a child of the parent shape.
 */
RestoreFromCacheVisitor.prototype.getShape = function(element, parentShape) {
  return this._cache.find(shape => {
    if (shape.businessObject !== element) {
      return false;
    }

    // for participants, we have to find the right band within the parent shape
    if (is(element, 'bpmn:Participant')) {
      return parentShape.bandShapes.includes(shape);
    }
    return true;
  });
};

/**
 * Finds the cached label belonging to the given element.
 */
RestoreFromCacheVisitor.prototype.getLabel = function(element) {
  return this._cache.find(shape => shape.businessObject === element && shape.type == 'label');
};