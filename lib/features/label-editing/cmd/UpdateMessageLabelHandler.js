import inherits from 'inherits';

import UpdateLabelHandler from 'bpmn-js/lib/features/label-editing/cmd/UpdateLabelHandler';

import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Command handler that takes care of updating the names of messages using direct
 * editing. Unfortunately, the super classes are not very extensible and we have to
 * use some strange patters.
 * @constructor
 * @param {Injector} injector
 * @param {EventBus} eventBus
 */
export default function UpdateMessageLabelHandler(injector, eventBus) {
  injector.invoke(UpdateLabelHandler, this);

  // have to use this strange override pattern as they do not use the prototype in the
  // super class unfortunately
  let superExecute = this.execute;
  this.execute = function(context) {
    if (is(context.element, 'bpmn:Message')) {
      context.oldLabel = context.element.name;
      context.element.name = context.newLabel;
      context.element.businessObject.name = context.newLabel;
      eventBus.fire('element.changed', {
        element: context.element
      });
    } else {
      superExecute.call(this, context);
    }
  };

  let superRevert = this.revert;
  this.revert = function(context) {
    if (is(context.element, 'bpmn:Message')) {
      context.element.name = context.oldLabel;
      context.element.businessObject.name = context.oldLabel;
      eventBus.fire('element.changed', {
        element: context.element
      });
    } else {
      superRevert.call(this, context);
    }
  };
}

inherits(UpdateMessageLabelHandler, UpdateLabelHandler);

UpdateMessageLabelHandler.$inject = [
  'injector',
  'eventBus'
];