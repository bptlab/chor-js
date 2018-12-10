import BehaviorModule from './behavior';
import DirectEditingModule from 'diagram-js-direct-editing';

import LabelEditingProvider from './LabelEditingProvider';

export default {
  __depends__: [
    BehaviorModule,
    DirectEditingModule
  ],
  __init__: [
    'choreoLabelEditingProvider'
  ],
  choreoLabelEditingProvider: ['type', LabelEditingProvider]
};