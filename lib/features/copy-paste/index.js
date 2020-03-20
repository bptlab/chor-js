import CopyPasteModule from 'diagram-js/lib/features/copy-paste';

import ChoreoCopyPaste from './ChoreoCopyPaste';
import ChoreoModdleCopy from './ChoreoModdleCopy';

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
  moddleCopy: ['type', ChoreoModdleCopy],
  bpmnCopyPaste: ['type', ChoreoCopyPaste],
};
