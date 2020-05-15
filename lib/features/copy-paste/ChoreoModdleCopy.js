import ModdleCopy from 'bpmn-js/lib/features/copy-paste/ModdleCopy';
import inherits from 'inherits';
import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

/**
 * This class overwrites two methods the ModdleCopy in bpmn-js. This mainly fixes copying messageFlows and participantRefs.
 * We also change the behavior from bpmn-js insofar that choreoActivities are actually copied on copy, not on paste,
 * preventing modification after the copy.
 * @param {Injector} injector
 * @param {Moddle} moddle
 * @param {EventBus} eventBus
 * @param {BpmnFactory} bpmnFactory
 * @constructor
 */
export default function ChoreoModdleCopy(injector, moddle, eventBus, bpmnFactory) {
  this._moddle = moddle;
  injector.invoke(ModdleCopy, this);
  const LOWER_PRIO = 650; // Must be lower than LOW_PRIORITY in BpmnCopyPaste.js

  // In bpmn-js these event listeners are attached in BpmnCopyPaste which shares the module with ModdleCopy,
  // however, they are not really decoupled anyways. To avoid having to overwrite that class as well, we simply attach
  // it here.
  eventBus.on('copyPaste.copyElement', LOWER_PRIO, (context) => {
    const descriptor = context.descriptor;
    const element = context.element;
    const businessObject = descriptor.oldBusinessObject;

    if (descriptor.isExpanded) {
      descriptor.collapsed = false;
    }
    if (descriptor.isExpanded === false) {
      descriptor.collapsed = true;
    }
    descriptor.hidden = element.hidden;

    // We need to trick a bit with the messageFlowRef. Thus, we store the name of the messages. New messages will be created
    // later by the CreateChoreoTaskBehavior because its the only important info about messages which are not copied themselves.
    // We also store direction and visibility.
    // Unfortunately, context.hints, which would be the cleaner option, does not work and
    // we would have to change code deep in the library to make it  work.
    var copyBusinessObject = bpmnFactory.create(businessObject.$type);
    if (businessObject.messageFlowRef) {
      copyBusinessObject.messageHints = businessObject.messageFlowRef.map(
        mf => {
          return {
            sourceRef: mf.sourceRef,
            name: mf.messageRef.name,
            isVisible: element.bandShapes.find(s => s.businessObject === mf.sourceRef).diBand.isMessageVisible
          };
        });
    }

    // To avoid that objects that were copied get manipulated and then the manipulated version gets pasted
    // we already create a copy here.
    // This is a known issue with bpmn-js https://github.com/bpmn-io/bpmn-js/issues/798
    if (is(businessObject, 'bpmn:ChoreographyActivity')) {
      descriptor.oldBusinessObject = this.copyElement(
        businessObject,
        copyBusinessObject
      );
    }
  });

}
inherits(ChoreoModdleCopy, ModdleCopy);

ChoreoModdleCopy.$inject = [
  'injector',
  'moddle',
  'eventBus',
  'bpmnFactory'
];

ChoreoModdleCopy.prototype.copyProperty = function(property, parent, propertyName) {
  // This function is called by BpmnCopyPast
  let copiedProperty = ModdleCopy.prototype.copyProperty.call(this, property, parent, propertyName);
  const propertyDescriptor = this._moddle.getPropertyDescriptor(parent, propertyName);

  // References are not copied by the bpmn-js ModdleCopy. However, we need to copy these references to reconstruct
  // the Choreo Activity.
  // Unlike most other references, they do not require the creation of new objects during copy-paste.
  if (!copiedProperty && propertyDescriptor.isReference) {
    if (propertyDescriptor.name === 'participantRef') {
      return [].concat(property);
    }
    if (propertyDescriptor.name === 'initiatingParticipantRef') {
      return property;
    }
  }
  return copiedProperty;
};

ChoreoModdleCopy.prototype.copyElement = function(sourceElement, targetElement, propertyNames) {
  if (sourceElement.messageHints) {
    targetElement.messageHints = sourceElement.messageHints;
  }
  return ModdleCopy.prototype.copyElement.call(this, sourceElement, targetElement, propertyNames);
};

