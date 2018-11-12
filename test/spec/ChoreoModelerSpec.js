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


  describe('choreo import', function() {
    const choreWithMultiplicities = require('../../resources/tasksWithMultiplicities.bpmn');
    const choreoWithLoops = require('../../resources/tasksWithLoopType.bpmn');

    it.skip('should have no warnings on import of choreo with multiplicities', function(done) {
      createModeler(choreWithMultiplicities, function(modeler, err, warnings) {
        expect(warnings).to.have.lengthOf(0);
        done();
      });
    });

    it('should have no error on import of choreo with multiplicities', function(done) {
      createModeler(choreWithMultiplicities, function(modeler, err, warnings) {
        expect(err).to.be.undefined;
        done();
      });
    });

    it.skip('should have no warnings on import of choreo with loops', function(done) {
      createModeler(choreoWithLoops, function(modeler, err, warnings) {
        expect(warnings).to.have.lengthOf(0);
        done();
      });
    });

    it('should have no error on import of choreo with loops', function(done) {
      createModeler(choreoWithLoops, function(modeler, err, warnings) {
        expect(err).to.be.undefined;
        done();
      });
    });

    it('should have correct choreo names', function(done) {
      createModeler(choreWithMultiplicities, function(modeler) {
        let elementRegistry = modeler.get('elementRegistry');
        let choreoTask_1 = elementRegistry.get('ChoreographyTask_1').businessObject;
        expect(choreoTask_1.name).to.eql('Task 1');
        done();
      });
    });
  });

});
