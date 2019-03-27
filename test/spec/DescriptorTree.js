var forEach = require('min-dash').forEach;


export default function DescriptorTree(tree) {

  var self = this;

  this._tree = {};
  this._length = 0;

  forEach(tree, function(branch, depth) {
    if (branch.length) {
      self._length += 1;
    }

    forEach(branch, function(element) {

      element.depth = parseInt(depth, 10);

      self._tree[element.id] = element;
    });

  });
}

/**
 * Returns the height of the tree, which is equivalent to the nesting level of the copied elements
 * @returns {number}
 */
DescriptorTree.prototype.getHeight = function() {
  return this._length;
};
/**
 * Get element by Id
 * @param id
 * @returns {*}
 */
DescriptorTree.prototype.getElement = function(id) {
  return this._tree[id];
};


DescriptorTree.prototype.getElementsAtDepth = function(depth) {
  var newTree = {};

  forEach(this._tree, function(element) {
    if (element.depth === depth) {
      newTree[element.id] = element;
    }
  });

  return newTree;
};

DescriptorTree.prototype.numberOfElementsAtDepth = function(depth) {
  var length = 0;

  forEach(this._tree, function(element) {
    if (element.depth === depth) {
      length += 1;
    }
  });

  return length;
};
