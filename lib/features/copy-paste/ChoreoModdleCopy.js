import {
  forEach,
  isArray,
  isDefined,
  isObject,
  reduce,
  has
} from 'min-dash';



/**
 * Utility for copying model properties from source element to target element.
 *
 * @param {EventBus} eventBus
 * @param {BpmnFactory} bpmnFactory
 * @param {BpmnModdle} moddle
 */
export default function ChoreoModdleCopy(eventBus, bpmnFactory, moddle) {
  this._bpmnFactory = bpmnFactory;
  this._eventBus = eventBus;
  this._moddle = moddle;


}

ChoreoModdleCopy.$inject = [
  'eventBus',
  'bpmnFactory',
  'moddle'
];

/**
 * Copy model properties of source element to target element.
 *
 * @param {ModdleElement} sourceElement
 * @param {ModdleElement} targetElement
 * @param {Array<string>} [propertyNames]
 *
 * @param {ModdleElement}
 */
ChoreoModdleCopy.prototype.copyElement = function(sourceElement, targetElement, propertyNames) {
  var self = this;

  if (propertyNames && !isArray(propertyNames)) {
    propertyNames = [ propertyNames ];
  }

  propertyNames = propertyNames || getPropertyNames(sourceElement.$descriptor);

  var canCopyProperties = this._eventBus.fire('moddleCopy.canCopyProperties', {
    propertyNames: propertyNames,
    sourceElement: sourceElement,
    targetElement: targetElement
  });

  if (canCopyProperties === false) {
    return targetElement;
  }

  if (isArray(canCopyProperties)) {
    propertyNames = canCopyProperties;
  }

  // copy properties
  forEach(propertyNames, function(propertyName) {
    var sourceProperty;

    if (has(sourceElement, propertyName)) {
      sourceProperty = sourceElement.get(propertyName);
    }

    var copiedProperty = self.copyProperty(sourceProperty, targetElement, propertyName);

    var canSetProperty = self._eventBus.fire('moddleCopy.canSetCopiedProperty', {
      parent: parent,
      property: copiedProperty,
      propertyName: propertyName
    });

    if (canSetProperty === false) {
      return;
    }

    if (isDefined(copiedProperty)) {
      targetElement.set(propertyName, copiedProperty);
    }
  });

  return targetElement;
};

/**
 * Copy model property.
 *
 * @param {*} property
 * @param {ModdleElement} parent
 * @param {string} propertyName
 *
 * @returns {*}
 */
ChoreoModdleCopy.prototype.copyProperty = function(property, parent, propertyName) {
  var self = this;

  // allow others to copy property
  var copiedProperty = this._eventBus.fire('moddleCopy.canCopyProperty', {
    parent: parent,
    property: property,
    propertyName: propertyName
  });

  // return if copying is NOT allowed
  if (copiedProperty === false) {
    return;
  }

  if (copiedProperty) {
    if (isObject(copiedProperty) && copiedProperty.$type && !copiedProperty.$parent) {
      copiedProperty.$parent = parent;
    }

    return copiedProperty;
  }

  var propertyDescriptor = this._moddle.getPropertyDescriptor(parent, propertyName);

  // Chor-js specific
  if (propertyDescriptor.name === 'participantRef') {
    return [].concat(property);
  }

  if (propertyDescriptor.name === 'initiatingParticipantRef') {
    return property;
  }
  // end chor-js specific

  // do NOT copy Ids and references
  if (propertyDescriptor.isId || propertyDescriptor.isReference) {
    return;
  }

  // copy arrays
  if (isArray(property)) {
    return reduce(property, function(childProperties, childProperty) {

      // recursion
      copiedProperty = self.copyProperty(childProperty, parent, propertyName);

      // copying might NOT be allowed
      if (copiedProperty) {
        copiedProperty.$parent = parent;

        return childProperties.concat(copiedProperty);
      }

      return childProperties;
    }, []);
  }

  // copy model elements
  if (isObject(property) && property.$type) {
    if (this._moddle.getElementDescriptor(property).isGeneric) {
      return;
    }

    copiedProperty = self._bpmnFactory.create(property.$type);

    copiedProperty.$parent = parent;

    // recursion
    copiedProperty = self.copyElement(property, copiedProperty);

    return copiedProperty;
  }

  // copy primitive properties
  return property;
};

// helpers //////////

export function getPropertyNames(descriptor, keepDefaultProperties) {
  return reduce(descriptor.properties, function(properties, property) {

    if (keepDefaultProperties && property.default) {
      return properties;
    }

    return properties.concat(property.name);
  }, []);
}

