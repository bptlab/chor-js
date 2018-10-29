import {
  reduce
} from 'min-dash';

import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

var HIGH_PRIORITY = 1500;


/**
 * Specific rules for choreographies
 */
export default function CustomRules(eventBus, elementFactory) {
  RuleProvider.call(this, eventBus);

  eventBus.on('resize.start', HIGH_PRIORITY, function(event) {
    let context = event.context
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
    };
  });
}

inherits(CustomRules, RuleProvider);

CustomRules.$inject = [ 'eventBus', 'elementFactory' ];


CustomRules.prototype.init = function() {

  /**
   * Can shape be created on target container?
   */
  function canCreate(shape, target) {
    // allow creation on choreography
    return is(target, 'bpmn:Choreography');
  }

  /**
   * Can source and target be connected?
   */
  function canConnect(source, target) {
    //TODO add rules for choreographies
    return;
  }

  this.addRule('shape.create', HIGH_PRIORITY, function(context) {
    var target = context.target,
        shape = context.shape;

    return canCreate(shape, target);
  });

  this.addRule('shape.resize', HIGH_PRIORITY, function(context) {
    var shape = context.shape;

    // choreography tasks and sub-choreographies can be resized
    if (shape.type === 'bpmn:ChoreographyTask' || shape.type === 'bpmn:SubChoreography') {
      return true;
    } else if (shape.type === 'bpmn:Participant') {
      return false;
    }
  });

  this.addRule('connection.create', HIGH_PRIORITY, function(context) {
    var source = context.source,
        target = context.target;

    return canConnect(source, target);
  });

  this.addRule('connection.reconnectStart', HIGH_PRIORITY, function(context) {
    var connection = context.connection,
        source = context.hover || context.source,
        target = connection.target;

    return canConnect(source, target, connection);
  });

  this.addRule('connection.reconnectEnd', HIGH_PRIORITY, function(context) {
    var connection = context.connection,
        source = connection.source,
        target = context.hover || context.target;

    return canConnect(source, target, connection);
  });
};
