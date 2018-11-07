import ChoreoElementFactory from './ChoreoElementFactory';
import ChoreoRenderer from './ChoreoRenderer';
import ChoreoPaletteProvider from './ChoreoPaletteProvider';
import ChoreoRules from './ChoreoRules';
import ChoreoUpdater from './ChoreoUpdater';
import ChoreoContextPadProvider from './ChoreoContextPadProvider';
import ChoreoImporter from './ChoreoImporter';

export default {
  __init__: [
    'bpmnImporter',
    'customRenderer',
    'elementFactory',
    'paletteProvider',
    'bpmnRules',
    'bpmnUpdater',
    'contextPadProvider'
  ],
  bpmnImporter: [ 'type', ChoreoImporter ],
  elementFactory: [ 'type', ChoreoElementFactory ],
  customRenderer: [ 'type', ChoreoRenderer ],
  paletteProvider: [ 'type', ChoreoPaletteProvider ],
  bpmnRules: [ 'type', ChoreoRules ],
  bpmnUpdater: [ 'type', ChoreoUpdater ],
  contextPadProvider: [ 'type', ChoreoContextPadProvider ]
};
