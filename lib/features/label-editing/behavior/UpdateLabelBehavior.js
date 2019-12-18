import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

/**
 * Command interceptor used to update all participant bands of a specific participant
 * when updating their name/label.
 * @constructor
 * @param {Injector} injector
 * @param {ElementRegistry} elementRegistry
 * @param {EventBus} eventBus
 * */
export default function UpdateLabelBehavior(injector, elementRegistry, eventBus) {

  injector.invoke(CommandInterceptor, this);

  this.preExecute('element.updateLabel', function(event) {
    let context = event.context;
    if (context.newLabel) {
      // replace all line breaks in the new name, we only want single line
      context.newLabel = context.newLabel.replace(/(?:\r\n|\r|\n)/g, '');
    }
  });

  this.executed('element.updateLabel', function(event) {
    let context = event.context;
    let shape = context.element;
    if (is(shape, 'bpmn:Participant')) {
      updateAllBands(shape.businessObject);
    } else if (is(shape, 'bpmn:ChoreographyActivity')) {
      // TODO investigate why this re-render is not handled by bpmn-js
      eventBus.fire('element.changed', {
        element: shape
      });
    }
  });

  this.reverted('element.updateLabel', function(event) {
    let context = event.context;
    let shape = context.element;
    if (is(shape, 'bpmn:Participant')) {
      updateAllBands(shape.businessObject);
    } else if (is(shape, 'bpmn:ChoreographyActivity')) {
      // TODO investigate why this re-render is not handled by bpmn-js
      eventBus.fire('element.changed', {
        element: shape
      });
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

inherits(UpdateLabelBehavior, CommandInterceptor);

UpdateLabelBehavior.$inject = [
  'injector',
  'elementRegistry',
  'eventBus'
];