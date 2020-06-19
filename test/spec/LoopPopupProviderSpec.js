import { bootstrapChorModeler, getChorJS, inject } from '../TestHelper';

describe('loop popup provider', function() {

  /**
   * Invokes an action in the Popup menu
   * @param popupMenu use inject to get the popup menu
   * @param element to open the menu on
   * @param loopType {string} that should be selected from menu
   */
  let invokeAction = function(popupMenu, element, loopType) {
    popupMenu.open(element, 'loop-provider', { x: 0, y: 0 });
    const entry = Object.values(popupMenu._current.entries).find(x => x.loopType === loopType);
    entry.action(undefined, entry);
  };

  const choreoWithLoops = require('../resources/tasksWithLoopType.bpmn');

  beforeEach(bootstrapChorModeler(choreoWithLoops));

  it('should mark selected loop types as active', function(done) {
    const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_2');
    inject(function(popupMenu) {
      popupMenu.open(elem, 'loop-provider', { x: 0, y: 0 });
      let entry = Object.values(popupMenu._current.entries).find(x => x.active);
      expect(entry.loopType).to.equal('Standard');
      done();
    })();
  });

  it('should be closed on default', function(done) {
    inject(function(popupMenu) {
      expect(popupMenu.isOpen()).to.be.false;
      done();
    })();
  });

  it('can be opened', function(done) {
    inject(function(popupMenu) {
      const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_2');
      popupMenu.open(elem, 'loop-provider', { x: 0, y: 0 });
      expect(popupMenu.isOpen()).to.be.true;
      done();
    })();
  });

  it('should toggle loop types exclusively', function(done) {
    const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_2');
    inject(function(popupMenu) {
      invokeAction(popupMenu, elem, 'MultiInstanceParallel');
      invokeAction(popupMenu, elem, 'MultiInstanceSequential');
      expect(Object.values(popupMenu._current.entries).filter(e => e.active)).to.have.length(1);
      expect(elem.businessObject.loopType).to.equal('MultiInstanceSequential');
      done();
    })();
  });

  it('should create changes in .bpmn file', function(done) {
    const none_task = getChorJS().get('elementRegistry').get('ChoreographyTask_1');
    const standard_task = getChorJS().get('elementRegistry').get('ChoreographyTask_2');
    const parallel_task = getChorJS().get('elementRegistry').get('ChoreographyTask_3');
    const sequential_task = getChorJS().get('elementRegistry').get('ChoreographyTask_4');
    inject(function(popupMenu) {
      invokeAction(popupMenu, none_task, 'MultiInstanceSequential');
      invokeAction(popupMenu, standard_task, 'MultiInstanceParallel');
      invokeAction(popupMenu, parallel_task, 'Standard');
      invokeAction(popupMenu, sequential_task, 'MultiInstanceSequential');
    })();
    getChorJS().saveXML({ format: true }).then(result => {
      const xml = result.xml;
      expect(xml).to.have.string('<bpmn2:choreographyTask id="ChoreographyTask_1" name="Basic Task" ' +
        'initiatingParticipantRef="Participant_1" loopType="MultiInstanceSequential">');
      expect(xml).to.have.string('<bpmn2:choreographyTask id="ChoreographyTask_2" name="Standard Loop Task" ' +
        'initiatingParticipantRef="Participant_1" loopType="MultiInstanceParallel">');
      expect(xml).to.have.string('<bpmn2:choreographyTask id="ChoreographyTask_3" name="Parallel Loop Task" ' +
        'initiatingParticipantRef="Participant_1" loopType="Standard">');
      expect(xml).to.have.string('<bpmn2:choreographyTask id="ChoreographyTask_4" name="Sequential Loop Task" ' +
        'initiatingParticipantRef="Participant_1">');
      done();
    });
  });

  it('should create Standard loop type', function(done) {
    const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_1');
    inject(function(popupMenu) {
      invokeAction(popupMenu, elem, 'Standard');
      expect(elem.businessObject.loopType).to.equal('Standard');
      done();
    })();
  });

  it('should create Multi Instance Parallel loop type', function(done) {
    const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_1');
    inject(function(popupMenu) {
      invokeAction(popupMenu, elem, 'MultiInstanceParallel');
      expect(elem.businessObject.loopType).to.equal('MultiInstanceParallel');
      done();
    })();
  });

  it('should create Multi Instance Sequential loop type', function(done) {
    const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_1');
    inject(function(popupMenu) {
      invokeAction(popupMenu, elem, 'MultiInstanceSequential');
      expect(elem.businessObject.loopType).to.equal('MultiInstanceSequential');
      done();
    })();
  });

  it('should remove loop type', function(done) {
    const standard_task = getChorJS().get('elementRegistry').get('ChoreographyTask_2');
    inject(function(popupMenu) {
      invokeAction(popupMenu, standard_task, 'Standard');
      expect(standard_task.businessObject.loopType).to.equal('None');
      done();
    })();
  });

  it('should have three loop types selectable', function(done) {
    const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_1');
    inject(function(popupMenu) {
      popupMenu.open(elem, 'loop-provider', { x: 0, y: 0 });
      expect(Object.values(popupMenu._current.entries).map(x => x.loopType)).to.have.members([
        'MultiInstanceParallel', 'MultiInstanceSequential', 'Standard']);
      done();
    })();
  });
});
