import diagram from '../resources/tasksWithLoopType.bpmn';

import $ from 'jquery';

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

function saveSVG(done) {
  modeler.saveSVG(done);
}

function saveDiagram(done) {
  modeler.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

$(function() {
  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);
    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(function() {
    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });
    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  modeler.on('commandStack.changed', exportArtifacts);
  exportArtifacts();
});

// expose bpmnjs to window for debugging purposes
window.bpmnjs = modeler;

// helpers //////////////////////

function debounce(fn, timeout) {

  var timer;

  return function() {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}