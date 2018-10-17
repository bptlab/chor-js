import diagram from '../resources/tasksWithMultiplicities.bpmn';

import CustomModeler from './custom-modeler';
import PropertiesPanelModule from 'bpmn-js-properties-panel';
import PropertiesProviderModule from './custom-modeler/properties-panel';

var modeler = new CustomModeler({
  additionalModules: [
    PropertiesPanelModule,
    PropertiesProviderModule
  ],
  container: '#canvas',
  propertiesPanel: {
    parent: '#properties'
  },
  keyboard: {
    bindTo: document
  }
});

modeler.importXML(diagram, function(err) {

  if (err) {
    console.error('something went wrong:', err);
  }

  modeler.get('canvas').zoom('fit-viewport');
});

// expose bpmnjs to window for debugging purposes
window.bpmnjs = modeler;