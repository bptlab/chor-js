import { bootstrapChorModeler, inject } from '../TestHelper';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai); // eslint-disable-line no-undef


describe('create participant handler', function() {

  const emptyXML = require('../resources/empty.bpmn');
  let Modeling, CommandStack, ChoreoUtil, ElementFactory, Canvas;

  const injectDependencies = inject(function(modeling, commandStack, choreoUtil, elementFactory, canvas) {
    /*
    we inject the dependencies into the global namespace. This way we do not have to wrap every function
    with #inject allowing us nicer integration with mocha and a clearer stacktrace.
    */
    Modeling = modeling;
    CommandStack = commandStack;
    ChoreoUtil = choreoUtil;
    ElementFactory = elementFactory;
    Canvas = canvas;
  });

  beforeEach(bootstrapChorModeler(emptyXML));
  beforeEach(injectDependencies);

  it('creates new participant', function() {
    const participant = Modeling.createParticipant();
    expect(participant).to.exist;
  });

  it('creates undoes participant creation', function() {
    const participant = Modeling.createParticipant();
    expect(participant).to.exist;
    expect(ChoreoUtil.currentChoreography().participants).to.have.lengthOf(1);
    CommandStack.undo();
    expect(ChoreoUtil.currentChoreography().participants).to.be.empty;
  });

  it('creates redoes participant creation', function() {
    const participant = Modeling.createParticipant();
    expect(participant).to.exist;
    expect(ChoreoUtil.currentChoreography().participants).to.have.lengthOf(1);
    CommandStack.undo();
    expect(ChoreoUtil.currentChoreography().participants).to.be.empty;
    CommandStack.redo();
    expect(ChoreoUtil.currentChoreography().participants).to.have.lengthOf(1);
  });

  describe('integration with task creation', function() {
    let modelingSpy, handlerExecuteSpy, handlerRevertSpy;

    beforeEach(function() {
      modelingSpy = sinon.spy(Modeling, 'createParticipant');
      const handler = CommandStack._getHandler('participant.create');
      handlerExecuteSpy = sinon.spy(handler, 'execute');
      handlerRevertSpy = sinon.spy(handler, 'revert');
    });

    it('creates 2 participants when creating task', function() {
      const shape = ElementFactory.createShape({ type: 'bpmn:ChoreographyTask' });
      Modeling.createShape(shape, { x:200, y:200 }, Canvas.getRootElement());

      expect(ChoreoUtil.currentChoreography().participants).to.have.lengthOf(2);
      expect(modelingSpy).to.have.been.calledTwice;
      expect(handlerExecuteSpy).to.have.been.calledTwice;
    });

    it('undoes creation of 2 participants when undoing creation of task', function() {
      const shape = ElementFactory.createShape({ type: 'bpmn:ChoreographyTask' });
      Modeling.createShape(shape, { x:200, y:200 }, Canvas.getRootElement());

      CommandStack.undo();
      expect(ChoreoUtil.currentChoreography().participants).to.be.empty;
      expect(handlerRevertSpy).to.have.been.calledTwice;
      expect(modelingSpy).to.have.been.calledTwice;
      expect(handlerExecuteSpy).to.have.been.calledTwice;
    });

    it('redoes creation of 2 participants when redoing creation of task', function() {
      const shape = ElementFactory.createShape({ type: 'bpmn:ChoreographyTask' });
      Modeling.createShape(shape, { x:200, y:200 }, Canvas.getRootElement());

      CommandStack.undo();
      CommandStack.redo();
      expect(ChoreoUtil.currentChoreography().participants).to.have.lengthOf(2);
      expect(handlerRevertSpy).to.have.been.calledTwice;
      expect(handlerExecuteSpy).to.have.callCount(4);
      expect(modelingSpy).to.have.been.calledTwice;
    });
  });
});
