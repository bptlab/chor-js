import ChoreoModeler from '../../lib/Modeler';
import { bootstrapBpmnJS as bootstrapChorJS, getBpmnJS as getChorJS, inject } from 'bpmn-js/test/helper/index';

describe('loop popup provider', function() {

  let invokeAction = function(popupMenu, element, loopType) {
    popupMenu.open(element, 'loop-provider', { x: 0, y: 0 });
    const entry = popupMenu._current.headerEntries.find(x => x.loopType = loopType);
    entry.action(undefined, entry);
  };

  const choreoWithLoops = require('../resources/tasksWithLoopType.bpmn');

  beforeEach(bootstrapChorJS(ChoreoModeler, choreoWithLoops));

  it('should mark selected loop types as active');
  it('should be closed on default', function(done) {
    inject(function(popupMenu) {
      expect(popupMenu.isOpen()).to.be.false;
      done();
    })();
  });

  it('should be open', function(done) {
    inject(function(popupMenu) {
      const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_2');
      popupMenu.open(elem, 'loop-provider', { x: 0, y: 0 });
      expect(popupMenu.isOpen()).to.be.true;
      done();
    })();
  });
  it('should be available only for Choreo Task');
  it('should toggle loop types exclusively');
  it('should create changes in .bpmn file');
  it('should create Standard loop type');
  it('should create Multi Instance Parallel loop type');

  it('should create Multi Instance Sequential loop type', function(done) {
    const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_1');
    inject(function(popupMenu) {
      let eventBus = getChorJS().get('eventBus');
      eventBus.on('element.changed', function(event) {
        expect(elem.businessObject.loopType).to.equal('MultiInstanceSequential');
        done();
      });
      invokeAction(popupMenu, elem, 'MultiInstanceSequential');
    })();
  });

  it('should have three loop types selectable', function(done) {
    const elem = getChorJS().get('elementRegistry').get('ChoreographyTask_1');
    inject(function(popupMenu) {
      popupMenu.open(elem, 'loop-provider', { x: 0, y: 0 });
      expect(popupMenu._current.headerEntries.map(x => x.loopType)).to.have.members([
        'MultiInstanceParallel', 'MultiInstanceSequential', 'Standard']);
      done();
    })();
  });
});