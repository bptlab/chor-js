import CustomElementFactory from './CustomElementFactory';
import CustomRenderer from './CustomRenderer';
import CustomPalette from './CustomPalette';
import CustomRules from './CustomRules';
import CustomUpdater from './CustomUpdater';
import CustomContextPadProvider from './CustomContextPadProvider';
import CustomImporter from './CustomImporter';

export default {
  __init__: [
    'bpmnImporter',
    'customRenderer',
    'elementFactory',
    'paletteProvider',
    'customRules',
    'bpmnUpdater',
    'contextPadProvider'
  ],
  bpmnImporter: [ 'type', CustomImporter ],
  elementFactory: [ 'type', CustomElementFactory ],
  customRenderer: [ 'type', CustomRenderer ],
  paletteProvider: [ 'type', CustomPalette ],
  customRules: [ 'type', CustomRules ],
  bpmnUpdater: [ 'type', CustomUpdater ],
  contextPadProvider: [ 'type', CustomContextPadProvider ]
};
