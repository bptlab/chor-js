import CopyPasteModule from 'diagram-js/lib/features/copy-paste';

import ChoreoModdleCopy from './ChoreoModdleCopy';

export default {
  __depends__: [
    CopyPasteModule
  ],
  __init__: [
    'moddleCopy',
  ],
  moddleCopy: ['type', ChoreoModdleCopy],
  // ChoreoModdleCopy  extends and replaces ModdleCopy,
  // which means we can use BpmnCopyPaste, which uses ModdleCopy.
  // These changes were introduced in bpmn-js 5.0.0
};
