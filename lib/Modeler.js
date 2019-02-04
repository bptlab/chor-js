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

Modeler.prototype.importDefinitions = function(definitions, done) {
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