import BaseViewer from 'bpmn-js/lib/Viewer';
import Diagram from 'diagram-js';
import Ids from 'ids';
import inherits from 'inherits';

import CoreModule from './core';

import {
  setXML,
  setDefinitions,
  displayChoreography
} from './import/ImportHandler';


/**
 * A regular viewer for choreography diagrams without navigation or modeling capabilities.
 */
export default function Viewer(options) {
  BaseViewer.call(this, options);

  // hook ID collection into the viewer
  this.on('import.parse.complete', function(event) {
    if (!event.error) {
      this._collectIds(event.definitions, event.context);
    }
  }, this);
  this.on('diagram.destroy', function() {
    this.get('moddle').ids.clear();
  }, this);
}

inherits(Viewer, BaseViewer);

Viewer.prototype.displayChoreography = function(options) {
  return displayChoreography(this, options);
};

Viewer.prototype.importXML = function(xml, options) {
  const self = this;
  return setXML(this, xml, options).then(() => {
    return displayChoreography(self, options);
  });
};

Viewer.prototype.importDefinitions = function(definitions, options) {
  const self = this;
  return setDefinitions(this, definitions, options).then(() => {
    return displayChoreography(self, options);
  });
};

Viewer.prototype.clear = function() {
  // Skip clearing of the DI references introduced in this commit by bpmn-js:
  // https://github.com/bpmn-io/bpmn-js/commit/0c71ad30a0c945679851e73b15647f634f2b9bb8
  // We need them remaining intact for later restoring the diagram from cache.
  Diagram.prototype.clear.call(this);
};

Viewer.prototype._createModdle = function(options) {
  let moddle = BaseViewer.prototype._createModdle.call(this, options);

  // attach ids to moddle to be able to track
  // and validated ids in the BPMN 2.0 XML document
  // tree
  moddle.ids = new Ids([ 32, 36, 1 ]);

  return moddle;
};

Viewer.prototype._collectIds = function(definitions, context) {

  let moddle = definitions.$model;
  let ids = moddle.ids;
  let id;

  // remove references from previous import
  ids.clear();

  for (id in context.elementsById) {
    ids.claim(id, context.elementsById[id]);
  }
};

Viewer.prototype._modules = [].concat(
  Viewer.prototype._modules, [
    CoreModule
  ]
);
