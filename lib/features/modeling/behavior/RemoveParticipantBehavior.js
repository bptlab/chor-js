import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  unlinkMessageSemantics,
  linkMessageSemantics,
  getMessageFlow
} from '../../../util/MessageUtil';
import { isDefined } from 'min-dash';


/**
 * Choreography specific participant removal. This overrides the handler of bpmn-js
 * with the same name via the module export as that one is focused on lanes/pools
 * which does not apply to choreographies.
 */
export default function RemoveParticipantBehavior(injector, eventBus, modeling) {

  CommandInterceptor.call(this, eventBus);

  this.postExecute('shape.delete', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Participant')) {
      if (isDefined(shape.attachedMessageShape)) {
        // we have to unlink the message and message flows attached to this band as well
        // if the corresponding shape has not been deleted (and thus, the DeleteMessageBehavior
        // has not kicked in)
        console.log(shape);
        let task = shape.activityShape.businessObject;
        let message = shape.attachedMessageShape.businessObject;
        let messageFlow = getMessageFlow(task, message);
        if (isDefined(messageFlow)) {
          context.oldMessageFlow = messageFlow;
          context.oldIndices = unlinkMessageSemantics(injector, task, message);
        }
      }
    }
  });

  this.reverted('shape.delete', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Participant')) {
      let task = shape.activityShape.businessObject;
      let messageFlow = context.oldMessageFlow;
      let indices = context.oldIndices;

      // relink shaped and semantic objects
      if (isDefined(messageFlow)) {
        linkMessageSemantics(injector, task, messageFlow, indices);
      }
    }
  });

}

RemoveParticipantBehavior.$inject = [
  'injector',
  'eventBus',
  'modeling'
];

inherits(RemoveParticipantBehavior, CommandInterceptor);