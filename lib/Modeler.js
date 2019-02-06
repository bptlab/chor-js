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
  setXML,
  displayChoreography
} from './import/ImportHandler';


/**
 * A modeler for BPMN 2.0 choreography diagrams.
 */
export default function Modeler(options) {
  BaseModeler.call(this, options);
}

inherits(Modeler, BaseModeler);

Modeler.prototype.setXML = function(xml, options) {
  return setXML(this, xml, options);
};

Modeler.prototype.displayChoreography = function(options) {
  return displayChoreography(this, options);
};

Modeler.prototype.importXML = function(xml, done) {
  let self = this;
  let warnings = [];
  this.setXML(xml).then(result => {
    warnings = result.warnings || warnings;
    return self.displayChoreography();
  }).then(result => {
    done(result.error, warnings.concat(result.warnings));
  }).catch(output => {
    done(output.error, warnings.concat(output.warnings));
  });
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