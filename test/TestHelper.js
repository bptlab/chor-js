export { inject } from 'bpmn-js/test/helper';
import { Modeler } from '../lib/Modeler';
import { bootstrapBpmnJS, getBpmnJS } from 'bpmn-js/test/helper';
import {
  insertCSS
} from 'bpmn-js/test/helper';

insertCSS('diagram-js.css', require('bpmn-js/dist/assets/diagram-js.css'));
insertCSS('bpmn-embedded.css', require('bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'));

insertCSS('diagram-js-testing.css',
  '.test-container .result { height: 500px; }' + '.test-container > div'
);


/**
 * Bootstraps an instance of the Choreo Modeler.
 * @param diagram the xml file
 * @param options
 * @param locals
 * @returns {Modeler}
 */
export function bootstrapChorModeler(diagram, options, locals) {
  return bootstrapBpmnJS(Modeler, diagram, options, locals);
}

/**
 * Returns the current active Choreo Modeler instance
 * @returns {Modeler}
 */
export function getChorJS() {
  return getBpmnJS();
}
