import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  unlinkMessageFlowSemantics,
  linkMessageFlowSemantics,
  getMessageFlow,
  removeAndGetIndex
} from '../../../util/MessageUtil';
import { isDefined } from 'min-dash';


/**
 * Choreography specific participant removal. This overrides the handler of bpmn-js
 * with the same name via the module export as that one is focused on lanes/pools
 * which does not apply to choreographies.
 */
export default function RemoveParticipantBehavior(injector, canvas, eventBus) {

  CommandInterceptor.call(this, eventBus);

  this.executed('shape.delete', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Participant')) {

      // unlink the DI object of the band (this is not done by bpmn-js)
      context.oldDiBand = shape.diBand;
      let choreo = canvas.getRootElement().businessObject;
      let bpmnDiagram = choreo.di;
      context.oldDiBandIndex = removeAndGetIndex(bpmnDiagram.get('planeElement'), shape.diBand);

      if (isDefined(shape.attachedMessageShape)) {
        // we have to unlink the message and message flows attached to this band as well
        // if the corresponding shape has not been deleted (and thus, the DeleteMessageBehavior
        // has not kicked in)
        let task = shape.activityShape.businessObject;
        let message = shape.attachedMessageShape.businessObject;
        let messageFlow = getMessageFlow(task, message);
        if (isDefined(messageFlow)) {
          context.oldMessageFlow = messageFlow;
          context.oldIndices = unlinkMessageFlowSemantics(injector, task, messageFlow);
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

      // relink the DI object of the band (this is not done by bpmn-js)
      let choreo = canvas.getRootElement().businessObject;
      let bpmnDiagram = choreo.di;
      bpmnDiagram.get('planeElement').splice(context.oldDiBandIndex, 0, context.oldDiBand);

      // relink shaped and semantic objects
      if (isDefined(messageFlow)) {
        linkMessageFlowSemantics(injector, task, messageFlow, indices);
      }
    }
  });

}

RemoveParticipantBehavior.$inject = [
  'injector',
  'canvas',
  'eventBus'
];

inherits(RemoveParticipantBehavior, CommandInterceptor);