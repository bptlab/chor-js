import inherits from 'inherits';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  removeAndGetIndex
} from '../../../util/MessageUtil';


/**
 * Choreography specific participant removal. This overrides the handler of bpmn-js
 * with the same name via the module export as that one is focused on lanes/pools
 * which does not apply to choreographies.
 * @constructor
 * @param {Injector} injector
 * @param {Canvas} canvas
 */
export default function RemoveParticipantBehavior(injector, canvas) {
  injector.invoke(CommandInterceptor, this);

  this.executed('shape.delete', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Participant')) {
      // unlink the DI object of the band (this is not done by bpmn-js)
      context.oldDiBand = shape.diBand;
      let choreo = canvas.getRootElement().businessObject;
      let bpmnDiagram = choreo.di;
      context.oldDiBandIndex = removeAndGetIndex(bpmnDiagram.get('planeElement'), shape.diBand);
    }
  });

  this.reverted('shape.delete', function(event) {
    let context = event.context;
    let shape = context.shape;

    if (is(shape, 'bpmn:Participant')) {
      // relink the DI object of the band (this is not done by bpmn-js)
      let choreo = canvas.getRootElement().businessObject;
      let bpmnDiagram = choreo.di;
      bpmnDiagram.get('planeElement').splice(context.oldDiBandIndex, 0, context.oldDiBand);
    }
  });
}

RemoveParticipantBehavior.$inject = [
  'injector',
  'canvas',
];

inherits(RemoveParticipantBehavior, CommandInterceptor);