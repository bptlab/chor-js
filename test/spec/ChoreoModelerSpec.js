import '../TestHelper';

import TestContainer from 'mocha-test-container-support';

import ChoreoModeler from '../../app/choreo-modeler';



describe('choreo modeler', function() {

  let container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  function createModeler(xml, importDone) {

    let modeler = new ChoreoModeler({
      container: container
    });

    modeler.importXML(xml, (err, warnings) => importDone(modeler, err, warnings));
  }


  describe('custom elements', function() {

    it('should run', function() {
    });

    it('should have correct choreo names', function(done) {
      let xml = require('../../resources/tasksWithMultiplicities.bpmn');
      createModeler(xml, function(modeler) {
        let elementRegistry = modeler.get('elementRegistry');
        let choreoTask_1 = elementRegistry.get('ChoreographyTask_1').businessObject;
        expect(choreoTask_1.name).to.eql('Task 1');
        done();
      });
    });
  });

});
