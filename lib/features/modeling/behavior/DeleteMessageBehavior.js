import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import {
  unlinkMessageFlowSemantics,
  linkMessageFlowSemantics,
  getMessageFlow
} from '../../../util/MessageUtil';
import { isDefined } from 'min-dash';

/**
 * Command interceptor used to properly delete messages in the semantic model.
 * @constructor
 * @param {Injector} injector
 * @param {Canvas} canvas
 */
export default function DeleteMessageBehavior(injector, canvas) {

  injector.invoke(CommandInterceptor, this);

  this.executed('shape.delete', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Message')) {
      let message = shape.businessObject;
      let task = context.oldParent.parent.businessObject;

      // unlink and remember the MessageFlow corresponding to this message
      let messageFlow = getMessageFlow(task, message);
      if (isDefined(messageFlow)) {
        context.oldMessageFlow = messageFlow;
        context.oldIndices = unlinkMessageFlowSemantics(injector, task, messageFlow);
      }
    }
  });

  this.reverted('shape.delete', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Message')) {
      let task = context.oldParent.parent.businessObject;
      let messageFlow = context.oldMessageFlow;
      let indices = context.oldIndices;

      // relink shaped and semantic objects
      if (isDefined(messageFlow)) {
        linkMessageFlowSemantics(injector, task, messageFlow, indices);
      }
    }
  });
}

inherits(DeleteMessageBehavior, CommandInterceptor);

DeleteMessageBehavior.$inject = [
  'injector',
  'canvas'
];