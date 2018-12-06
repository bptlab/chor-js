import DirectEditingModule from 'diagram-js-direct-editing';

import LabelEditingProvider from './LabelEditingProvider';

export default {
  __depends__: [
    DirectEditingModule
  ],
  __init__: [
    'choreoLabelEditingProvider'
  ],
  choreoLabelEditingProvider: ['type', LabelEditingProvider]
};