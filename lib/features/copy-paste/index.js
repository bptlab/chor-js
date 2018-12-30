import CopyPasteModule from 'diagram-js/lib/features/copy-paste';

import ChoreoCopyPaste from './ChoreoCopyPaste';

/**
 * We completely overwrite the standard bpmnCopyPaste with our own because it registers a function in its constructor
 * EventBus.on('element.paste') that we do not want to execute an cannot otherwise 'nicely' overwrite.
 * Modeler and its parents theoretically have on option parameter in their constructor that allows this as well (see
 * bpmnModeler docs). The following would have to be added in the ChoreoModeler constructor and passed to Modeler:
 *
 const opt = options || {};
 const overrideModule = {
      __depends__: [
        CopyPasteModule
      ],
      __init__: ['bpmnCopyPaste'],
      bpmnCopyPaste: ['type', ChoreoCopyPaste]
    };
 assign(opt, { additionalModules: [ overrideModule ] });
 *
 * In addition, CopyPasteModule should then no longer be included in the modules array.
 * We opt for the other strategy as it is the way already used by ChoreoRules.
 * Both strategies ultimately work the same way by relying on the fact the later entry overwrites the earlier (original)
 * entry of the same name, before the modules are initialized.
 */
export default {
  __depends__: [
    CopyPasteModule
  ],
  __init__: ['bpmnCopyPaste'],
  bpmnCopyPaste: ['type', ChoreoCopyPaste]
};
