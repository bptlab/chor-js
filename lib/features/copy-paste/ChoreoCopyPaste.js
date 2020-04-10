import {
  getBusinessObject,
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  forEach,
  isArray,
  isUndefined,
  omit,
  reduce
} from 'min-dash';

function copyProperties(source, target, properties) {
  if (!isArray(properties)) {
    properties = [properties];
  }

  forEach(properties, function(property) {
    if (!isUndefined(source[property])) {
      target[property] = source[property];
    }
  });
}

function removeProperties(element, properties) {
  if (!isArray(properties)) {
    properties = [properties];
  }

  forEach(properties, function(property) {
    if (element[property]) {
      delete element[property];
    }
  });
}

var LOW_PRIORITY = 750;

/**
 * @param {BpmnFactory} bpmnFactory
 * @param eventBus
 * @param moddleCopy
 * @constructor
 */
export default function ChoreoCopyPaste(bpmnFactory, eventBus, moddleCopy) {

  eventBus.on('copyPaste.copyElement', LOW_PRIORITY, function(context) {
    var descriptor = context.descriptor,
        element = context.element;
    var businessObject = descriptor.oldBusinessObject = getBusinessObject(element);

    descriptor.type = element.type;

    copyProperties(businessObject, descriptor, 'name');

    descriptor.di = {};

    // fill and stroke will be set to DI
    copyProperties(businessObject.di, descriptor.di, [
      'fill',
      'stroke'
    ]);
    copyProperties(businessObject.di, descriptor, 'isExpanded');
    if (descriptor.isExpanded) {
      descriptor.collapsed = false;
    }
    if (descriptor.isExpanded === false) {
      descriptor.collapsed = true;
    }

    if (isLabel(descriptor)) {
      return descriptor;
    }

    // default sequence flow
    if (businessObject.default) {
      descriptor.default = businessObject.default.id;
    }

    // Chor-js specific
    // To avoid that objects that were copied get manipulated and then the manipulated version gets pasted
    // we already do an additional copy here.
    // This is a known issue with bpmn-js https://github.com/bpmn-io/bpmn-js/issues/798
    descriptor.hidden = element.hidden;
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
    // End Chor-js specific

    descriptor.copyBusinessObject = moddleCopy.copyElement(
      businessObject,
      copyBusinessObject
    );
  });

  eventBus.on('moddleCopy.canCopyProperty', function(context) {
    var parent = context.parent,
        property = context.property,
        propertyName = context.propertyName,
        bpmnProcess;
    if (propertyName === 'flowElements') {
      return false;
    }
    if (
      propertyName === 'processRef' &&
      is(parent, 'bpmn:Participant') &&
      is(property, 'bpmn:Process')
    ) {
      bpmnProcess = bpmnFactory.create('bpmn:Process');

      // return copy of process
      return moddleCopy.copyElement(property, bpmnProcess);
    }
  });

  var references;

  function resolveReferences(descriptor, cache) {
    var businessObject = getBusinessObject(descriptor);
    // default sequence flows
    if (descriptor.default) {

      // relationship cannot be resolved immediately
      references[descriptor.default] = {
        element: businessObject,
        property: 'default'
      };
    }

    // boundary events
    if (descriptor.host) {

      // relationship can be resolved immediately
      getBusinessObject(descriptor).attachedToRef = getBusinessObject(cache[descriptor.host]);
    }

    references = omit(references, reduce(references, function(array, reference, key) {
      var element = reference.element,
          property = reference.property;

      if (key === descriptor.id) {
        element[property] = businessObject;

        array.push(descriptor.id);
      }

      return array;
    }, []));

    if (descriptor.ref) {
      console.log(descriptor.ref);
    }
  }

  eventBus.on('copyPaste.pasteElements', function() {
    references = {};
  });

  /**
   * context.descriptor describes what will later be the shape
   */
  eventBus.on('copyPaste.pasteElement', function(context) {
    var cache = context.cache,
        descriptor = context.descriptor,
        copyBusinessObject = descriptor.copyBusinessObject,
        newBusinessObject;

    // do NOT copy business object if external label
    if (isLabel(descriptor)) {
      descriptor.businessObject = getBusinessObject(cache[descriptor.labelTarget]);

      return;
    }
    // We create a new business from the business object we already copied to avoid copying mutations of the original
    newBusinessObject = bpmnFactory.create(copyBusinessObject.$type);
    newBusinessObject.messageHints = copyBusinessObject.messageHints;
    descriptor.businessObject = moddleCopy.copyElement(
      copyBusinessObject,
      newBusinessObject
    );

    // resolve references e.g. default sequence flow
    resolveReferences(descriptor, cache);

    copyProperties(descriptor, newBusinessObject, [
      'isExpanded',
      'name',
    ]);

    removeProperties(descriptor, ['copyBusinessObject', 'oldBusinessObject']);
  });

}

ChoreoCopyPaste.$inject = [
  'bpmnFactory',
  'eventBus',
  'moddleCopy'
];

// helpers //////////

function isLabel(element) {
  return !!element.labelTarget;
}
