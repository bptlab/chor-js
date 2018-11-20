import BehaviorModule from './behavior';

import ChoreoElementFactory from './ChoreoElementFactory';
import ChoreoRenderer from './ChoreoRenderer';
import ChoreoPaletteProvider from './ChoreoPaletteProvider';
import ChoreoRules from './ChoreoRules';
import ChoreoUpdater from './ChoreoUpdater';
import ChoreoContextPadProvider from './ChoreoContextPadProvider';
import ChoreoModeling from './ChoreoModeling';

export default {
  __init__: [
    'choreoRenderer',
    'elementFactory',
    'paletteProvider',
    'bpmnRules',
    'bpmnUpdater',
    'contextPadProvider',
    'modeling'
  ],
  __depends__: [
    BehaviorModule
  ],
  elementFactory: [ 'type', ChoreoElementFactory ],
  choreoRenderer: [ 'type', ChoreoRenderer ],
  paletteProvider: [ 'type', ChoreoPaletteProvider ],
  bpmnRules: [ 'type', ChoreoRules ],
  bpmnUpdater: [ 'type', ChoreoUpdater ],
  contextPadProvider: [ 'type', ChoreoContextPadProvider ],
  modeling: [ 'type', ChoreoModeling ]
};
