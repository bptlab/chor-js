import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import { getMessageFlow } from '../../../util/MessageUtil';
import { unlinkMessageSemantics, linkMessageSemantics } from '../../../util/MessageUtil';

/**
 * Command interceptor used to properly delete messages in the semantic model.
 */
export default function DeleteMessageBehavior(injector, canvas) {

  injector.invoke(CommandInterceptor, this);

  this.postExecute('shape.delete', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Message')) {
      let message = shape.businessObject;
      let task = context.oldParent.parent.businessObject;

      // unlink and remember the MessageFlow corresponding to this message
      let messageFlow = getMessageFlow(task, message);
      context.oldMessageFlow = messageFlow;
      context.oldIndices = unlinkMessageSemantics(injector, task, messageFlow);
      delete context.oldParent.attachedMessageShape;
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
      context.oldParent.attachedMessageShape = shape;
      linkMessageSemantics(injector, task, messageFlow, indices);
    }
  });
}

inherits(DeleteMessageBehavior, CommandInterceptor);

DeleteMessageBehavior.$inject = [
  'injector',
  'canvas'
];