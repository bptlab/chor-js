import { bootstrapChorModeler, inject, createCanvasEvent, getBounds } from '../TestHelper';

import { isMac } from 'diagram-js/lib/util/Platform';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai); // eslint-disable-line no-undef

describe('feature/space-tool', function() {

  const oneTaskXML = require('../resources/oneTask.bpmn');
  const bigTaskXML = require('../resources/oneBigTask.bpmn');
  let Dragging, SpaceTool, ElementRegistry, EventBus;

  const injectDependencies = inject(function(dragging, spaceTool, elementRegistry, autoScroll, eventBus) {
    /* we inject the dependencies into the global namespace. This way we do not have to wrap every function
    with #inject allowing us nicer integration with mocha and a clearer stacktrace.
    */
    Dragging = dragging;
    SpaceTool = spaceTool;
    ElementRegistry = elementRegistry;
    EventBus = eventBus;
    autoScroll.setOptions({ scrollStep: 0 }); // Disables auto scroll with the cross-hair enabled which is triggers a
    // lot by accident when inspecting the test container in mocha
  });

  describe('event spaceTool.move', function() {
    beforeEach(bootstrapChorModeler(oneTaskXML));
    beforeEach(injectDependencies);

    it('selects messages and bands as movable when moving a task', function() {
      const listener = sinon.spy(function(event) {
        const context = event.context;
        if (context.initialized) {
          expect(context.movingShapes, 'Bands, Messages and Activity are moving').to.be.of.length(5);
          expect(context.resizingShapes, 'Nothing is resized').to.be.empty;
        }
      });
      EventBus.on('spaceTool.move', 1 , listener);
      moveSpaceTool(Dragging, SpaceTool,{ startX: 100, startY: 100, deltaX: 100 });
      expect(listener).to.have.been.calledTwice;
    });

    it('does not select bands as movable or resizable when resizing an activity vertically', function() {
      const listener = sinon.spy(function(event) {
        const context = event.context;
        if (context.initialized) {
          expect(context.movingShapes, 'Bands and Messages are not moving shapes').to.be.empty;
          expect(context.resizingShapes, 'Only Task is resizing directly').to.have.members([getTask(ElementRegistry)]);
        }
      });
      EventBus.on('spaceTool.move', 1 , listener);
      moveSpaceTool(Dragging, SpaceTool,{ startX: 350, startY: 350, deltaY: -50 });
      expect(listener).to.have.been.calledTwice;
    });

    it('does not select bands or messages as resizable when resizing an activity horizontally', function() {
      const listener = sinon.spy(function(event) {
        const context = event.context;
        if (context.initialized) {
          expect(context.movingShapes, 'No moving shapes').to.be.empty;
          expect(context.resizingShapes, 'Only Task is resizing directly').to.have.members([getTask(ElementRegistry)]);
        }
      });
      EventBus.on('spaceTool.move', 1 , listener);
      const task = getTask(ElementRegistry);
      moveSpaceTool(Dragging, SpaceTool,{ startX: task.x + 0.5 * task.width , startY: task.y + 0.5 * task.height, deltaX: 50 });
      expect(listener).to.have.been.calledTwice;
    });

  });


  describe('task moving keeps participants and messages attached', function() {
    beforeEach(bootstrapChorModeler(oneTaskXML));
    beforeEach(injectDependencies);

    const tests = [
      { deltaX: 100, message: 'to the right when pushing from the left' },
      { deltaX: -100, message: 'to the left when pulling from the left' },
      { deltaX: -100, startX: 500, pressModifierKey: true, message: 'to the left when pushing from the right' },
      { deltaX: 100, startX: 500, pressModifierKey: true, message: 'to the right when pulling from the right' },
      { deltaY: 100, message: 'downwards when pushing from above' },
      { deltaY: 100, startY: 500, pressModifierKey: true, message: 'downwards when pulling from below' },
      { deltaY: -100, message: 'upwards when pulling from above' },
      { deltaY: -100, startY: 500, pressModifierKey: true, message: 'upwards when pushing from below' },

      { startY: 290, deltaY: -100, message: 'upwards when pulling between band and message' },
      { startY: 290, deltaY: 100, message: 'downwards when pushing between band and message' }
    ];


    tests.forEach(function(config) {
      it('correctly moves task, bands, and messages ' + config.message, function() {
        let topBand = getTopBand(ElementRegistry);
        let bottomBand = getBottomBand(ElementRegistry);
        let topMessage = getTopMessage(ElementRegistry);
        let bottomMessage = getBottomMessage(ElementRegistry);
        const task = getTask(ElementRegistry);

        const oldTaskX = task.x;
        const oldTaskY = task.y;
        const messageOffset = task.y - topMessage.y - topMessage.height; // height + magic number 20
        moveSpaceTool(Dragging, SpaceTool, config);

        // check x
        expect(task.x).to.equal(oldTaskX + (config.deltaX | 0), 'Task moves horizontally');

        expect(topBand.x).to.equal(task.x, 'Top band horizontal position is equal to task`s horizontal position');
        expect(bottomBand.x).to.equal(task.x, 'Bottom band horizontal position is equal to task`s horizontal position');

        expect(topMessage.x).to.equal(task.x + task.width / 2 - topMessage.width / 2, 'Top message is centered horizontally');
        expect(bottomMessage.x).to.equal(task.x + task.width / 2 - bottomMessage.width / 2, 'Bottom message is centered horizontally');

        // check y
        expect(task.y).to.equal(oldTaskY + (config.deltaY | 0), 'Task moves vertically');

        expect(topBand.y).to.equal(task.y, 'Top band vertical position is equal to task`s vertical position');
        expect(bottomBand.y).to.equal(task.y + task.height - bottomBand.height, 'Top band vertical position is correct');

        expect(topMessage.y).to.equal(task.y - messageOffset - topMessage.height, 'Top message vertical position is correct');
        expect(bottomMessage.y).to.equal(task.y + task.height + messageOffset, 'Bottom message vertical position is correct');
      });
    });

  });


  describe('task resizing keeps messages attached and resizes bands', function() {
    beforeEach(bootstrapChorModeler(bigTaskXML));
    beforeEach(injectDependencies);

    const tests = [
      // increasing size
      { deltaX: 100, message: 'increases size when pulling to the right' },
      { startX: 305, startY: 305, deltaX: 100, message: 'increases size when pulling on the band to the right ' },
      { deltaX: -100, pressModifierKey: true, message: 'increases size when pulling to the left' },
      { deltaY: 100, message: 'increases size when pulling downwards' },
      { startY: 370, deltaY: 100, message: 'increases size when pulling on the bottom band downwards ' },
      { deltaY: -100, pressModifierKey: true, message: 'increases size when pulling upwards' },
      { startX: 305, startY: 305, deltaY: -100, pressModifierKey: true, message: 'increases size when pulling on the top band upwards' },

      // decreasing size
      { startX: 499, deltaX: -100, message: 'decreases size when pulling from the right', shrink: true },
      { startX: 301, deltaX: 100, pressModifierKey: true, message: 'decrease size when pushing from the left', shrink: true },
      { startY: 321, deltaY: 100, pressModifierKey: true, message: 'decrease size when pushing downwards from the top', shrink: true },
      { startY: 310, deltaY: 100, pressModifierKey: true, message: 'decrease size when pushing downwards from the top on the band', shrink: true },
      { startY: 359, deltaY: -100, message: 'decrease size when pulling upwards from the mid/bottom', shrink: true },
      { startY: 375, deltaY: -100, message: 'decrease size when pulling upwards from the bottom band', shrink: true },
      { startY: 305, deltaY: -50, message: 'decrease size when pulling upwards from the top  band', shrink: true },
    ];


    tests.forEach(function(config) {
      it('correctly ' + config.message, function() {
        let topBand = getTopBand(ElementRegistry);
        let bottomBand = getBottomBand(ElementRegistry);
        let topMessage = getTopMessage(ElementRegistry);
        let bottomMessage = getBottomMessage(ElementRegistry);
        const task = getTask(ElementRegistry);

        const oldTaskBounds = getBounds(task);
        const oldUpperBandBounds = getBounds(topBand);
        const oldBottomBandBounds = getBounds(bottomBand);
        const messageOffset = task.y - topMessage.y - topMessage.height; // height + magic number = 20

        config.startX = config.startX || oldTaskBounds.x + 0.5 * oldTaskBounds.width;
        config.startY = config.startY || oldTaskBounds.y + 0.5 * oldTaskBounds.height;

        moveSpaceTool(Dragging, SpaceTool, config);

        // check x
        const actualXDelta = (config.shrink ? -1 : 1) * (Math.abs(config.deltaX) || 0);
        expect(task.width).to.equal(oldTaskBounds.width + actualXDelta, 'Task width scaled correctly');

        expect(topBand.width).to.equal(task.width, 'Top band width scaled correctly');
        expect(bottomBand.width).to.equal(task.width, 'Bottom band width scaled correctly');

        expect(topMessage.x).to.equal(task.x + task.width / 2 - topMessage.width / 2, 'Top message stays centered horizontally');
        expect(bottomMessage.x).to.equal(task.x + task.width / 2 - bottomMessage.width / 2, 'Top message stays centered horizontally');

        // check y
        const actualYDelta = (config.shrink ? -1 : 1) * (Math.abs(config.deltaY) || 0);
        expect(task.height).to.equal(oldTaskBounds.height + actualYDelta, 'Task height scaled correctly');

        expect(topBand.y).to.equal(task.y, 'Top band horizontal position is correct');
        expect(bottomBand.y).to.equal(task.y + task.height - bottomBand.height, 'Bottom band horizontal position is correct');

        expect(topBand.height).to.equal(oldUpperBandBounds.height, 'Top band height did not scale');
        expect(bottomBand.height).to.equal(oldBottomBandBounds.height, 'Bottom band height did not scale');

        expect(topMessage.y).to.equal(task.y - messageOffset - topMessage.height, 'Top message vertical position is correct');
        expect(bottomMessage.y).to.equal(task.y + task.height + messageOffset, 'Bottom message vertical position is correct');
      });
    });

  });
});

// helpers



function moveSpaceTool(dragging, spaceTool, { startX = 150, startY = 150, deltaX = 0, deltaY = 0, pressModifierKey = false, message = '' }) {
  if (Math.abs(deltaX) % 10 !== 0 || Math.abs(deltaY) % 10 !== 0) {
    console.warn('The spacetool can only move precisely in multiples of 10');
  }

  if (!(Math.abs(deltaX) >= 21 || Math.abs(deltaY) >= 21)) {
    console.warn('Delta is not large enough. The graphical representation will start auto-scrolling to infinity. ' +
      'This should however not affect the test result');
  }

  const keyModifier = pressModifierKey ? (isMac() ? { metaKey: true } : { ctrlKey: true }) : {};

  spaceTool.activateMakeSpace(createCanvasEvent({ x: startX, y: startY }));

  dragging.move(createCanvasEvent({ x: startX + deltaX, y: startY + deltaY }, keyModifier));

  dragging.end();
}

function getTask(elementRegistry) {
  return elementRegistry.get('ChoreographyTask_Activity');
}

function getTopMessage(elementRegistry) {
  return elementRegistry.get('Message_M1');
}

function getBottomMessage(elementRegistry) {
  return elementRegistry.get('Message_M2');
}

function getTopBand(elementRegistry) {
  return getTask(elementRegistry).bandShapes[0];
}

function getBottomBand(elementRegistry) {
  return getTask(elementRegistry).bandShapes[1];
}

