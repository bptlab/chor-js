/**
 * A handler that toggles the hidden/visibility state of an element
 * and the visibility of all its children and children's children.
 *
 * @param {Modeling} modeling
 */
export default function ToggleShapeVisibilityHandler(modeling) {
  this._modeling = modeling;
}

ToggleShapeVisibilityHandler.$inject = [ 'modeling' ];

ToggleShapeVisibilityHandler.prototype.preExecute = function(context) {

  var shape = context.shape,
      children = shape.children;

  if (children) {
    children.forEach(child => {
      self._modeling.toggleVisibility(child);
    })
  }

};

ToggleShapeVisibilityHandler.prototype.execute = function(context) {

  var shape = context.shape,
      children = shape.children;

  // remember previous visibility of children
  context.oldChildrenVisibility = getElementsVisibility(children);

  // hide/show children
  setHidden(children, shape.collapsed);

  return [shape].concat(children);
};


ToggleShapeVisibilityHandler.prototype.revert = function(context) {

  var shape = context.shape,
      oldChildrenVisibility = context.oldChildrenVisibility;

  var children = shape.children;

  // set old visability of children
  restoreVisibility(children, oldChildrenVisibility);

  return [shape].concat(children);
};


// helpers //////////////////////

/**
 * Return a map { elementId -> hiddenState}.
 *
 * @param {Array<djs.model.Shape>} elements
 *
 * @return {Object}
 */
function getElementsVisibility(elements) {

  var result = {};

  elements.forEach(function(e) {
    result[e.id] = e.hidden;
  });

  return result;
}


function setHidden(elements, newHidden) {
  elements.forEach(function(element) {
    element.hidden = newHidden;
  });
}

function restoreVisibility(elements, lastState) {
  elements.forEach(function(e) {
    e.hidden = lastState[e.id];
  });
}
