import '../TestHelper';

import TestContainer from 'mocha-test-container-support';

import ChoreoModeler from '../../app/choreo-modeler';


describe('choreo modelerr', function() {
  const choreoWithMultiplicities = require('../../resources/tasksWithMultiplicities.bpmn');
  const choreoWithLoops = require('../../resources/tasksWithLoopType.bpmn');

  let container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  /**
   * Creates a new modeler and calls importDone with it after importing an xml diagram
   * @param {string} xml bpmn diagram
   * @param {function(ChoreoModeler, ElementRegistry, Error, string[])} importDone taking a modeler, an ElementRegistry,
   * error, and warnings
   */
  function createModeler(xml, importDone) {

    const modelerr = new ChoreoModeler({
      container: container
    });

    const elementRegistry = modelerr.get('elementRegistry');

    modelerr.importXML(xml, (err, warnings) => importDone(modelerr, elementRegistry, err, warnings));
  }

  /**
   * Creates a new modeler for each diagram and calls importDone with it after importing an xml diagram
   * @param {function(ChoreoModeler, ElementRegistry, Error, string[])} importDone taking a modeler, an ElementRegistry,
   * error, and warnings
   */
  function createModelerForEachDiagram(importDone) {
    const allDiagrams = [choreoWithLoops, choreoWithMultiplicities];
    allDiagrams.forEach(xml => createModeler(xml, importDone));
  }


  describe('choreo import', function() {

    it.skip('should have no warnings on import of choreo with multiplicities', function(done) {
      createModeler(choreoWithMultiplicities, function(modelerr, elemReg, err, warnings) {
        expect(warnings).to.be.empty;
        done();
      });
    });

    it('should have no error on import of choreo with multiplicities', function(done) {
      createModeler(choreoWithMultiplicities, function(modelerr, elemReg, err, warnings) {
        expect(err).to.be.undefined;
        done();
      });
    });

    it.skip('should have no warnings on import of choreo with loops', function(done) {
      createModeler(choreoWithLoops, function(modelerr, elemReg, err, warnings) {
        expect(warnings).to.be.empty;
        done();
      });
    });

    it('should have no error on import of choreo with loops', function(done) {
      createModeler(choreoWithLoops, function(modelerr, elemReg, err, warnings) {
        expect(err).to.be.undefined;
        done();
      });
    });

    it('should have correct choreo names', function(done) {
      createModeler(choreoWithMultiplicities, function(modelerr, elemReg) {
        let choreoTask_1 = elemReg.get('ChoreographyTask_1').businessObject;
        expect(choreoTask_1.name).to.eql('Task 1');
        done();
      });
    });

    it('should have standard loop marker', function(done) {
      createModeler(choreoWithLoops, function(modelerr, elemReg) {
        const businessObject = elemReg.get('ChoreographyTask_2').businessObject;
        expect(businessObject.loopType).to.equal('Standard');
        const gfx = elemReg.getGraphics('ChoreographyTask_2');
        const marker = gfx.querySelector('[data-marker=loop]');
        expect(marker).to.exist;
        done();
      });
    });

    it('should have parallel loop marker', function(done) {
      createModeler(choreoWithLoops, function(modeler, elemReg) {
        const businessObject = elemReg.get('ChoreographyTask_3').businessObject;
        expect(businessObject.loopType).to.equal('MultiInstanceParallel');
        const gfx = elemReg.getGraphics('ChoreographyTask_3');
        const marker = gfx.querySelectorAll('[data-marker=parallel]');
        expect(marker).to.have.lengthOf(1);
        done();
      });
    });

    it('should have sequential loop marker', function(done) {
      createModeler(choreoWithLoops, function(modeler, elemReg) {
        const businessObject = elemReg.get('ChoreographyTask_4').businessObject;
        expect(businessObject.loopType).to.equal('MultiInstanceSequential');
        const gfx = elemReg.getGraphics('ChoreographyTask_4');
        const marker = gfx.querySelectorAll('[data-marker=sequential]');
        expect(marker).to.have.lengthOf(1);
        done();
      });
    });

    it('should have sequential loop marker', function(done) {
      createModeler(choreoWithLoops, function(modeler, elemReg) {
        const businessObject = elemReg.get('ChoreographyTask_4').businessObject;
        expect(businessObject.loopType).to.equal('MultiInstanceSequential');
        const gfx = elemReg.getGraphics('ChoreographyTask_4');
        const marker = gfx.querySelectorAll('[data-marker=sequential]');
        expect(marker).to.have.lengthOf(1);
        done();
      });
    });

    it('should have correct bpmn:ChoreographyTask type for Choreo Tasks', function(done) {
      createModeler(choreoWithLoops, function(modeler, elemReg) {
        const choreoTask = elemReg.get('ChoreographyTask_1');
        expect(choreoTask.businessObject.$type).to.equal('bpmn:ChoreographyTask');
        expect(choreoTask.type).to.equal('bpmn:ChoreographyTask');
        done();
      });
    });

    it('should have one initiating participant', function(done) {
      createModeler(choreoWithLoops, function(modeler, elemReg) {
        const businessObject = elemReg.get('ChoreographyTask_1').businessObject;
        expect(businessObject.initiatingParticipantRef).to.exist;
        expect(businessObject.initiatingParticipantRef.$type).to.equal('bpmn:Participant');
        done();
      });
    });

    it('should have exactly two participants for each ChoreoTask', function(done) {
      createModelerForEachDiagram(function(modeler, elemReg) {
        elemReg.filter(shape => shape.type === 'bpmn:ChoreographyTask').forEach(
          choreoTask => expect(choreoTask.businessObject.participantRefs, 'Participants').to.have.lengthOf(2)
        );
        done();
      });
    });
  });

});
