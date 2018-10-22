import Modeler from 'bpmn-js/lib/Modeler';

import inherits from 'inherits';

import CustomModule from './custom';

import {
  importChoreographyDiagram
} from './import/ChoreographyImporter';


export default function CustomModeler(options) {
  Modeler.call(this, options);
}

inherits(CustomModeler, Modeler);

CustomModeler.prototype.importDefinitions = function(definitions, done) {
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
  return importChoreographyDiagram(this, definitions, done);
};

CustomModeler.prototype._modules = [].concat(
  CustomModeler.prototype._modules,
  [
    CustomModule
  ]
);