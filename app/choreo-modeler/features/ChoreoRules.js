import inherits from 'inherits';

import BpmnRules from 'bpmn-js/lib/features/rules/BpmnRules';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

let HIGH_PRIORITY = 1500;

/**
 * Specific rules for choreographies. We have to override and replace BpmnRules and can not add
 * another RuleProvider. This is because BpmnRules is often directly called by other components
 * to evaluate rules which bypasses the EventBus.
 */
export default function CustomRules(injector, eventBus, elementFactory) {
  injector.invoke(BpmnRules, this);

  eventBus.on('resize.start', HIGH_PRIORITY, function(event) {
    let context = event.context;
    if (is(event.shape, 'bpmn:ChoreographyTask')) {
      // set the constraints for resizing choreography tasks
      let minDimensions = elementFactory._getDefaultSize(event.shape.businessObject);
      context.childrenBoxPadding = 0;
      context.resizeConstraints = {
        min: {
          top: event.shape.y + event.shape.height - minDimensions.height,
          bottom: event.shape.y + minDimensions.height,
          right: event.shape.x + minDimensions.width,
          left: event.shape.x + event.shape.width - minDimensions.width
        }
      };
    }
  });
}

inherits(CustomRules, BpmnRules);

CustomRules.$inject = [ 'injector', 'eventBus', 'elementFactory' ];

/**
 * Unfortunately the rules they define in BpmnRules call local methods instead of prototype
 * methods, i.e., canConnect() instead of this.canConnect(). That means that we have to redefine
 * most rules as they would otherwise still call those local methods and not our overridden
 * versions.
 */
CustomRules.prototype.init = function() {
  let self = this;

  this.addRule('connection.create', function(context) {
    var source = context.source,
        target = context.target,
        hints = context.hints || {},
        targetParent = hints.targetParent,
        targetAttach = hints.targetAttach;

    // don't allow incoming connections on
    // newly created boundary events
    // to boundary events
    if (targetAttach) {
      return false;
    }

    // temporarily set target parent for scoping
    // checks to work
    if (targetParent) {
      target.parent = targetParent;
    }

    try {
      return self.canConnect(source, target);
    } finally {
      // unset temporary target parent
      if (targetParent) {
        target.parent = null;
      }
    }
  });

  this.addRule('connection.reconnectStart', function(context) {
    var connection = context.connection,
        source = context.hover || context.source,
        target = connection.target;

    return self.canConnect(source, target, connection);
  });

  this.addRule('connection.reconnectEnd', function(context) {
    var connection = context.connection,
        source = connection.source,
        target = context.hover || context.target;

    return self.canConnect(source, target, connection);
  });

  this.addRule('shape.resize', function(context) {
    var shape = context.shape,
        newBounds = context.newBounds;

    return self.canResize(shape, newBounds);
  });

  this.addRule('elements.move', function(context) {
    var target = context.target,
        shapes = context.shapes,
        position = context.position;

    return self.canAttach(shapes, target, null, position) ||
           self.canReplace(shapes, target, position) ||
           self.canMove(shapes, target, position) ||
           self.canInsert(shapes, target, position);
  });

  this.addRule('shape.create', function(context) {
    return self.canCreate(
      context.shape,
      context.target,
      context.source,
      context.position
    );
  });

  this.addRule('shape.attach', function(context) {
    return self.canAttach(
      context.shape,
      context.target,
      null,
      context.position
    );
  });

  this.addRule('element.copy', function(context) {
    var collection = context.collection,
        element = context.element;

    return self.canCopy(collection, element);
  });

  this.addRule('element.paste', function(context) {
    var parent = context.parent,
        element = context.element,
        position = context.position,
        source = context.source,
        target = context.target;

    if (source || target) {
      return self.canConnect(source, target);
    }

    return self.canAttach([ element ], parent, null, position) || self.canCreate(element, parent, null, position);
  });

  this.addRule('elements.paste', function(context) {
    var tree = context.tree,
        target = context.target;

    return self.canPaste(tree, target);
  });
};

CustomRules.prototype.canCreate = function(shape, target, source, position) {
  if (is(target, 'bpmn:Choreography')) {
    // elements can be created within a choreography
    return true;
  }
  return BpmnRules.prototype.canCreate.call(this, shape, target, source, position);
};

CustomRules.prototype.canConnect = function(source, target, connection) {
  if (!is(connection, 'bpmn:DataAssociation')) {
    if (is(source, 'bpmn:EventBasedGateway') && is(target, 'bpmn:ChoreographyTask')) {
      // event-based gateways can connect to choreography tasks
      return { type: 'bpmn:SequenceFlow' };
    }
  }
  return BpmnRules.prototype.canConnect.call(this, source, target, connection);
};

CustomRules.prototype.canResize = function(shape, newBounds) {
  if (shape.type === 'bpmn:ChoreographyTask' || shape.type === 'bpmn:SubChoreography') {
    // choreography activities can be resized
    return true;
  } else if (shape.type === 'bpmn:Participant') {
    // participants (= participant bands) can not be resized
    return false;
  }
  return BpmnRules.prototype.canResize.call(this, shape, newBounds);
};