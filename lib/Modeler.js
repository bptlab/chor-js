import BaseModeler from 'bpmn-js/lib/Modeler';

import inherits from 'inherits';

import CoreModule from './core';

import ContextPadModule from './features/context-pad';
import KeyboardModule from './features/keyboard';
import KeyboardMoveSelectionModule from './features/keyboard-move-selection';
import LabelEditingModule from './features/label-editing';
import ModelingModule from './features/modeling';
import PaletteModule from './features/palette';
import PopupMenuModule from './features/popup-menu';
import ResizeModule from './features/resize';
import RulesModule from './features/rules';

import {
  importChoreoDiagram
} from './import/ImportHandler';


export default function Modeler(options) {
  BaseModeler.call(this, options);
}

inherits(Modeler, BaseModeler);

Modeler.prototype.setXML = function(xml, options) {
  let self = this;
  return new Promise((resolve, reject) => {
    xml = self._emit('import.parse.start', { xml: xml }) || xml;
    this._moddle.fromXML(xml, 'bpmn:Definitions', function(error, definitions, context) {
      definitions = self._emit('import.parse.complete', {
        error: error,
        definitions: definitions,
        context: context
      }) || definitions;

      if (error) {
        let output = { error: error, warnings: context.warnings };
        self._emit('import.done', output);
        reject(output);
      } else {
        let output = { definitions: definitions, warnings: context.warnings };
        self._emit('import.done', output);
        resolve(output);
      }
    });
  });
};

Modeler.prototype.displayDiagram = function(choreoID, options) {
  let self = this;
  return new Promise((resolve, reject) => {
    try {
      if (this._definitions) {
        this.clear();
      }
    } catch (e) {
      return reject(e);
    }
    return importChoreoDiagram(self, self._definitions, done, choreoID);
  });
}

Modeler.prototype.importDefinitions = function(definitions, done, choreoID) {
  try {
    if (this._definitions) {
      this.clear();
    }
    this._definitions = definitions;
  } catch (e) {
    return done(e);
  }
  return importChoreoDiagram(this, definitions, done, choreoID);
};

Modeler.prototype._modules = [].concat(
  Modeler.prototype._modules, [
    CoreModule
  ], [
    ContextPadModule,
    KeyboardModule,
    KeyboardMoveSelectionModule,
    LabelEditingModule,
    ModelingModule,
    PaletteModule,
    PopupMenuModule,
    ResizeModule,
    RulesModule
  ]
);