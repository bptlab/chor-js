import pizzaDiagram from '../resources/pizza-collaboration.bpmn';

import customElements from './custom-elements.json';

import CustomModeler from './custom-modeler';
import PropertiesPanelModule from 'bpmn-js-properties-panel';
//import PropertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/bpmn';
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

modeler.importXML(pizzaDiagram, function(err) {

  if (err) {
    console.error('something went wrong:', err);
  }

  modeler.get('canvas').zoom('fit-viewport');

  //modeler.addCustomElements(customElements);
});


// expose bpmnjs to window for debugging purposes
window.bpmnjs = modeler;
