import BaseViewer from 'bpmn-js/lib/Viewer';
import Ids from 'ids';
import inherits from 'inherits';

import CoreModule from './core';

import {
  importChoreoDiagram
} from './import/ImportHandler';


export default function Viewer(options) {
  BaseViewer.call(this, options);
    // hook ID collection into the modeler
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

Viewer.prototype.importDefinitions = function(definitions, done) {
  try {
    if (this._definitions) {
      this.clear();
    }
    this._definitions = definitions;
  } catch (e) {
    return done(e);
  }
  return importChoreoDiagram(this, definitions, done);
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