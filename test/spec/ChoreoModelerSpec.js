import '../TestHelper';

import TestContainer from 'mocha-test-container-support';

import ChoreoModeler from '../../lib/Modeler';


describe('choreo modeler', function() {
  const choreoWithMultiplicities = require('../resources/tasksWithMultiplicities.bpmn');
  const choreoWithLoops = require('../resources/tasksWithLoopType.bpmn');

  let container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  /**
   * Returns a promise resolving with a new modeler instance displaying the given XML diagram.
   */
  function createModeler(xml) {
    const modeler = new ChoreoModeler({
      container: container
    });
    return modeler.importXML(xml).then(() => {
      return modeler;
    });
  }

  describe('choreo import', function() {

    it('should not fail on import of choreo with multiplicities', function(done) {
      createModeler(choreoWithMultiplicities).then(modeler => {
        done();
      });
    });

    it('should not fail on import of choreo with loops', function(done) {
      createModeler(choreoWithLoops).then(modeler => {
        done();
      });
    });

    it('should have correct task names', function(done) {
      createModeler(choreoWithMultiplicities).then(modeler => {
        const elemReg = modeler.get('elementRegistry');
        let choreoTask_1 = elemReg.get('ChoreographyTask_1').businessObject;
        expect(choreoTask_1.name).to.eql('Task 1');
        done();
      });
    });

    it('should have standard loop marker', function(done) {
      createModeler(choreoWithLoops).then(modeler => {
        const elemReg = modeler.get('elementRegistry');
        const businessObject = elemReg.get('ChoreographyTask_2').businessObject;
        expect(businessObject.loopType).to.equal('Standard');
        const gfx = elemReg.getGraphics('ChoreographyTask_2');
        const marker = gfx.querySelector('[data-marker=loop]');
        expect(marker).to.exist;
        done();
      });
    });

    it('should have parallel loop marker', function(done) {
      createModeler(choreoWithLoops).then(modeler => {
        const elemReg = modeler.get('elementRegistry');
        const businessObject = elemReg.get('ChoreographyTask_3').businessObject;
        expect(businessObject.loopType).to.equal('MultiInstanceParallel');
        const gfx = elemReg.getGraphics('ChoreographyTask_3');
        const marker = gfx.querySelector('[data-marker=parallel]');
        expect(marker).to.exist;
        done();
      });
    });

    it('should have sequential loop marker', function(done) {
      createModeler(choreoWithLoops).then(modeler => {
        const elemReg = modeler.get('elementRegistry');
        const businessObject = elemReg.get('ChoreographyTask_4').businessObject;
        expect(businessObject.loopType).to.equal('MultiInstanceSequential');
        const gfx = elemReg.getGraphics('ChoreographyTask_4');
        const marker = gfx.querySelector('[data-marker=sequential]');
        expect(marker).to.exist;
        done();
      });
    });

    it('should have correct bpmn:ChoreographyTask type for Choreo Tasks', function(done) {
      createModeler(choreoWithLoops).then(modeler => {
        const elemReg = modeler.get('elementRegistry');
        const choreoTask = elemReg.get('ChoreographyTask_1');
        expect(choreoTask.businessObject.$type).to.equal('bpmn:ChoreographyTask');
        expect(choreoTask.type).to.equal('bpmn:ChoreographyTask');
        done();
      });
    });

    it('should have one initiating participant', function(done) {
      createModeler(choreoWithLoops).then(modeler => {
        const elemReg = modeler.get('elementRegistry');
        const businessObject = elemReg.get('ChoreographyTask_1').businessObject;
        expect(businessObject.initiatingParticipantRef).to.exist;
        expect(businessObject.initiatingParticipantRef.$type).to.equal('bpmn:Participant');
        done();
      });
    });

    it('should have exactly two participants for each ChoreoTask', function(done) {
      createModeler(choreoWithLoops).then(modeler => {
        const elemReg = modeler.get('elementRegistry');
        elemReg.filter(shape => shape.type === 'bpmn:ChoreographyTask').forEach(
          choreoTask => expect(choreoTask.businessObject.participantRef, 'Participants').to.have.lengthOf(2)
        );
        done();
      });
    });

    it('should export xml without error', function(done) {
      createModeler(choreoWithLoops).then(modeler => {
        return modeler.saveXML({ format: true });
      }).then(result => {
        done();
      });
    });
  });

});
