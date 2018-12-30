import Modeler from 'bpmn-js/lib/Modeler';

import inherits from 'inherits';

import CoreModule from './core';

import ContextPadModule from './features/context-pad';
import LabelEditingModule from './features/label-editing';
import ModelingModule from './features/modeling';
import PaletteModule from './features/palette';
import PopupMenuModule from './features/popup-menu';
import ResizeModule from './features/resize';
import RulesModule from './features/rules';
import CopyPasteModule from './features/copy-paste';

import {
  importChoreoDiagram
} from './import/ImportHandler';
import { assign } from 'min-dash';
import ChoreoCopyPaste from './features/copy-paste/ChoreoCopyPaste';

export default function ChoreoModeler(options) {
  const opt = options || {};
  const overrideModule = {
    __depends__: [
      CopyPasteModule
    ],
    __init__: ['bpmnCopyPaste'],
    bpmnCopyPaste: ['type', ChoreoCopyPaste]
  };
  // todo: make clean
  //assign(opt, { additionalModules: [ overrideModule ] });
  Modeler.call(this, opt);
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
    LabelEditingModule,
    ModelingModule,
    PaletteModule,
    PopupMenuModule,
    ResizeModule,
    RulesModule,
    CopyPasteModule
  ]
);