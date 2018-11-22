import Modeler from 'bpmn-js/lib/Modeler';

import inherits from 'inherits';

import FeaturesModule from './lib/features';
import ImportModule from './lib/import';

import {
  importChoreoDiagram
} from './lib/import/ImportHandler';


export default function ChoreoModeler(options) {
  Modeler.call(this, options);
}

inherits(ChoreoModeler, Modeler);

ChoreoModeler.prototype.importDefinitions = function(definitions, done) {
  // catch synchronous exceptions during #clear()
  try {
    if (this._definitions) {
      // clear existing rendered diagram
      this.clear();
    }

    // update definitions
    this._definitions = definitions;
  } catch (e) {
    return done(e);
  }

  // perform graphical import
  return importChoreoDiagram(this, definitions, done);
};

ChoreoModeler.prototype._modules = [].concat(
  ChoreoModeler.prototype._modules,
  [
    FeaturesModule
  ],
  [
    ImportModule
  ]
);