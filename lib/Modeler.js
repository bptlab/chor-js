import Modeler from 'bpmn-js/lib/Modeler';

import inherits from 'inherits';

import CoreModule from './core';

import ContextPadModule from './features/context-pad';
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
    CoreModule
  ],
  [
    ContextPadModule,
    KeyboardMoveSelectionModule,
    LabelEditingModule,
    ModelingModule,
    PaletteModule,
    PopupMenuModule,
    ResizeModule,
    RulesModule
  ]
);