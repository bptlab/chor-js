import CopyPasteModule from 'diagram-js/lib/features/copy-paste';

import BpmnCopyPaste from 'bpmn-js/lib/features/copy-paste/BpmnCopyPaste';
import ChoreoModdleCopy from './ChoreoModdleCopy';

export default {
  __depends__: [
    CopyPasteModule
  ],
  __init__: [
    'moddleCopy',
    'bpmnCopyPaste'
  ],
  moddleCopy: ['type', ChoreoModdleCopy],
  bpmnCopyPaste: ['type', BpmnCopyPaste]
  // We can use the original BpmnCopyPaste, as we add a low prio event listener in ChoreoModdleCopy that takes care
  // of the chore specific things we need to handle.
};
