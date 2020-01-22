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
export default function NewChoreoCopyPaste(bpmnFactory, eventBus, moddleCopy) {

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

    if (isLabel(descriptor)) {
      return descriptor;
    }

    // default sequence flow
    if (businessObject.default) {
      descriptor.default = businessObject.default.id;
    }

    // //Chor-js specific
    // if (is(businessObject, 'bpmn:Participant') || is(businessObject, 'bpmn:Message')){
    //   descriptor.priority = 2;
    //   descriptor.ref = element.parent;
    // }
    // descriptor.bandShapes = [].concat(element.bandShapes);
    if (element.bandShapes) {
      descriptor.bandDICopys = element.bandShapes.map(b => {
        return {
          participantBandKind: b.diBand.participantBandKind,
          isMessageVisible: b.diBand.isMessageVisible,
          isMarkerVisible: b.diBand.isMarkerVisible
        };
      });
    }
    // / End Chor-js specific

    // to avoid that objects get copied their copie gets manipulated an then the manipulated version gets pasted
    // we already do an additional copy here.
    var copyBusinessObject = bpmnFactory.create(businessObject.$type);

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

    newBusinessObject = bpmnFactory.create(copyBusinessObject.$type);

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

NewChoreoCopyPaste.$inject = [
  'bpmnFactory',
  'eventBus',
  'moddleCopy'
];

// helpers //////////

function isLabel(element) {
  return !!element.labelTarget;
}
