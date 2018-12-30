import CopyPasteModule from 'diagram-js/lib/features/copy-paste';

import ChoreoCopyPaste from './ChoreoCopyPaste';

/**
 * We completely overwrite the standard bpmnCopyPaste with our own because it registers a function in its constructor
 * on 'element.paste' that we do not want to execute an cannot otherwise 'nicely' overwrite.
 * Modeler and its parents theoretically have on option parameter in their constructer that should also allow this (see
 * bpmnModeler docs), however, I did not get it to work and it appears the documentation is not 100% correct.
 */
export default {
  __depends__: [
    CopyPasteModule
  ],
  __init__: ['bpmnCopyPaste'],
  bpmnCopyPaste: ['type', ChoreoCopyPaste]
};
