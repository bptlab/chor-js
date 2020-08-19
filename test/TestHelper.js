import ChoreoModeler from '../lib/Modeler';
import { bootstrapBpmnJS, getBpmnJS, inject as bpmnInject, insertCSS } from 'bpmn-js/test/helper';
import { assign } from 'min-dash';




insertCSS('diagram-js-testing.css',
  'body .test-container { height: auto; margin: 15px; }' +
  'body .test-content-container {margin: 0px; }' +
  'body .test-container .test-content-container .bjs-container { height: 80vmin !important; min-height: 300px;}'
);

export const inject = bpmnInject;


/**
 * Bootstraps an instance of the Choreo Modeler.
 * @param diagram the xml file
 * @param options
 * @param locals
 * @returns {ChoreoModeler}
 */
export function bootstrapChorModeler(diagram, options, locals) {
  return bootstrapBpmnJS(ChoreoModeler, diagram, options, locals);
}

/**
 * Returns the current active Choreo Modeler instance
 * @returns {ChoreoModeler}
 */
export function getChorJS() {
  return getBpmnJS();
}

/* The two functions below had to be copied from 'bpmn-js/test/util/MockEvents' test because that file has an import
   (getBpmnJS from 'test/TestHelper') that can not be resolvet probably because it is not relative. bpmn-js 7.2
*/
/**
 * Create an event with global coordinates
 * computed based on the loaded diagrams canvas position and the
 * specified canvas local coordinates.
 *
 * @param {Point} position of the event local the canvas (closure)
 * @param {Object} data
 *
 * @return {Event} event, scoped to the given canvas
 */
export function createCanvasEvent(position, data) {

  return getChorJS().invoke(function(canvas) {

    var target = canvas._svg;

    var clientRect = canvas._container.getBoundingClientRect();

    var absolutePosition = {
      x: position.x + clientRect.left,
      y: position.y + clientRect.top
    };

    return createEvent(target, absolutePosition, data);
  });
}


export function createEvent(target, position, data) {

  return getChorJS().invoke(function(eventBus) {
    data = assign({
      target: target,
      clientX: position.x,
      clientY: position.y,
      offsetX: position.x,
      offsetY: position.y
    }, data || {});

    return eventBus.createEvent(data);
  });
}

export function getBounds(shape) {
  return {
    x: shape.x,
    y: shape.y,
    height: shape.height,
    width: shape.width
  };
}
