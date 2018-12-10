import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

/**
 * Command interceptor used to update all participant bands of a specific participant
 * when updating their name/label.
 */
export default function UpdateParticipantNameBehavior(injector, elementRegistry, eventBus) {

  injector.invoke(CommandInterceptor, this);

  this.preExecute('element.updateLabel', function(event) {
    let context = event.context;
    let shape = context.element;
    if (is(shape, 'bpmn:Participant')) {
      // replace all line breaks in the new name, we only want single line
      context.newLabel = context.newLabel.replace(/(?:\r\n|\r|\n)/g, '');
    }
  });

  this.executed('element.updateLabel', function(event) {
    let context = event.context;
    let shape = context.element;
    if (is(shape, 'bpmn:Participant')) {
      updateAllBands(shape.businessObject);
    }
  });

  this.reverted('element.updateLabel', function(event) {
    let context = event.context;
    let shape = context.element;
    if (is(shape, 'bpmn:Participant')) {
      updateAllBands(shape.businessObject);
    }
  });

  function updateAllBands(participant) {
    let bandShapes = elementRegistry.filter((element, gfx) => element.businessObject === participant);
    bandShapes.forEach(bandShape => {
      eventBus.fire('element.changed', {
        element: bandShape
      });
    });
  }
}

inherits(UpdateParticipantNameBehavior, CommandInterceptor);

UpdateParticipantNameBehavior.$inject = [
  'injector',
  'elementRegistry',
  'eventBus'
];