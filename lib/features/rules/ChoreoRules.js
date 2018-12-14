import inherits from 'inherits';

import BpmnRules from 'bpmn-js/lib/features/rules/BpmnRules';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  isDefined
} from 'min-dash';

/**
 * Specific rules for choreographies. We have to override and replace BpmnRules and can not add
 * another RuleProvider. This is because BpmnRules is often directly called by other components
 * to evaluate rules which bypasses the EventBus.
 */
export default function ChoreoRules(injector) {
  injector.invoke(BpmnRules, this);
}

inherits(ChoreoRules, BpmnRules);

ChoreoRules.$inject = [ 'injector', 'eventBus', 'elementFactory' ];

/**
 * Unfortunately the rules they define in BpmnRules call local methods instead of prototype
 * methods, i.e., canConnect() instead of this.canConnect(). That means that we have to redefine
 * most rules as they would otherwise still call those local methods and not our overridden
 * versions.
 */
ChoreoRules.prototype.init = function() {
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

  this.addRule('band.create', function(context) {
    let activityShape = context.activityShape;

    // bands can only be created on sub- and call choreographies
    return (is(activityShape, 'bpmn:SubChoreography') || is(activityShape, 'bpmn:CallChoreography'));
  });

  this.addRule('band.delete', function(context) {
    let activityShape = context.activityShape;

    // bands can only be deleted from sub and call choreographies when there are
    // at least two left afterwards
    if (is(activityShape, 'bpmn:SubChoreography') || is(activityShape, 'bpmn:CallChoreography')) {
      return activityShape.bandShapes.length > 2;
    }
    return false;
  });

  this.addRule('message.toggle', function(context) {
    let element = context.element;
    if (is(element, 'bpmn:Message')) {
      // message shapes can only be hidden
      return 'hide';
    } else if (is(element, 'bpmn:Participant') && is(element.parent, 'bpmn:ChoreographyTask')) {
      // for bands, a shape can only be shown/hidden if it has been created previously
      if (isDefined(element.attachedMessageShape)) {
        if (element.children && element.children.length > 0) {
          return 'hide';
        } else {
          return 'show';
        }
      } else {
        // otherwise, we can only create a new message
        return 'create';
      }
    }
  });

  this.addRule('band.move', function(context) {
    let activityShape = context.activityShape;
    let bandShape = context.bandShape;
    let upwards = context.upwards;
    let bandIndex = activityShape.bandShapes.findIndex(shape => shape === bandShape);

    if (upwards) {
      // bands can only move upwards if they are not already at the top
      return bandIndex > 0;
    } else {
      // bands can only move downwards if they are not already at the bottom
      return bandIndex < activityShape.bandShapes.length - 1;
    }
  });

  this.addRule('elements.delete', function(context) {
    return context.elements.filter(element => {
      // participant bands cannot be removed using the regular pathway, they need to
      // be removed via `band.delete` or via the deletion of a choreo activity
      if (is(element, 'bpmn:Participant')) {
        return false;
      }

      // messages can only be deleted if they are non-initiating
      if (is(element, 'bpmn:Message')) {
        return element.parent.diBand.participantBandKind.endsWith('non_initiating');
      }

      // all other elements can be deleted
      return true;
    });
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

ChoreoRules.prototype.canCreate = function(shape, target, source, position) {
  if (is(target, 'bpmn:Choreography')) {
    // elements can be created within a choreography
    return true;
  }
  return BpmnRules.prototype.canCreate.call(this, shape, target, source, position);
};

ChoreoRules.prototype.canConnect = function(source, target, connection) {
  if (!is(connection, 'bpmn:DataAssociation')) {
    if (is(source, 'bpmn:EventBasedGateway') && is(target, 'bpmn:ChoreographyTask')) {
      // event-based gateways can connect to choreography tasks
      return { type: 'bpmn:SequenceFlow' };
    }
  }
  return BpmnRules.prototype.canConnect.call(this, source, target, connection);
};

ChoreoRules.prototype.canResize = function(shape, newBounds) {
  if (is(shape, 'bpmn:ChoreographyActivity')) {
    // choreography activities can be resized
    return true;
  } else if (shape.type === 'bpmn:Participant') {
    // participants (= participant bands) can not be resized
    return false;
  }
  return BpmnRules.prototype.canResize.call(this, shape, newBounds);
};