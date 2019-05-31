import BehaviorModule from './behavior';
import DirectEditingModule from 'diagram-js-direct-editing';

import ChoreoLabelEditingProvider from './ChoreoLabelEditingProvider';

export default {
  __depends__: [
    BehaviorModule,
    DirectEditingModule
  ],
  __init__: [
    'labelEditingProvider'
  ],
  // Here we overwrite the bpmnjs provider by giving ours the same name
  labelEditingProvider: ['type', ChoreoLabelEditingProvider]
};