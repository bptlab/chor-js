import CopyPasteModule from 'diagram-js/lib/features/copy-paste';

import ChoreoCopyPaste from './ChoreoCopyPaste';
import ChoreoModdleCopy from './ChoreoModdleCopy';
import BpmnCopyPaste from 'bpmn-js/lib/features/copy-paste/BpmnCopyPaste';
import NewChoreoModdleCopy from './NewChoreoModdleCopy';

/**
 * We completely overwrite the standard bpmnCopyPaste and register ChoreoCopyPaste as its replacement. We needt to do this,
 * because bpmnCopyPaste registers a function in its constructor
 * EventBus.on('copyPaste.copyElement') that we do not want to execute an cannot otherwise 'nicely' overwrite and prevent from
 * bpmnCopyPaste from executing on paste.
 */
export default {
  __depends__: [
    CopyPasteModule
  ],
  __init__: [
    'moddleCopy',
    'bpmnCopyPaste'
  ],
  moddleCopy: ['type', NewChoreoModdleCopy],
 // bpmnCopyPaste: ['type', ChoreoCopyPaste],
  bpmnCopyPaste: ['type', BpmnCopyPaste],
};
