import {
  bootstrapChorModeler,
  getChorJS,
  inject
} from '../TestHelper';

import {
  map,
  forEach
} from 'min-dash';

import DescriptorTree from './DescriptorTree';

import { is } from 'bpmn-js/lib/util/ModelUtil';

describe('features/copy-paste', function() {

  const basicXML = require('../resources/AllChoreoTypes.bpmn');

  describe('basic diagram', function() {

    beforeEach(bootstrapChorModeler(basicXML));

    describe('copy', function() {

      it('selected elements', inject(function(elementRegistry, copyPaste) {

        // when
        const SUB_CHOREO_ID = 'SubChoreography_1lywprj';
        const tree = copy([SUB_CHOREO_ID]);
        const subChoreo = tree.getElement(SUB_CHOREO_ID);

        const ids = ['SubChoreography_1lywprj', 'ChoreographyTask_093vv4x', 'StartEvent_0vgi8b6', 'EndEvent_1gmyy45',
          'Participant_1_SubChoreography_1lywprj', 'Participant_2_SubChoreography_1lywprj', 'SequenceFlow_102fgpm',
          'SequenceFlow_0jv4yjf', 'StartEvent_0vgi8b6_label', 'EndEvent_1gmyy45_label',
          'Participant_1_ChoreographyTask_093vv4x', 'Participant_2_ChoreographyTask_093vv4x', 'Message_0bkq11l'];
        // then
        expect(Object.keys(tree._tree).length).to.equal(8); // Participants and Messages are not copied
        expect(tree.getHeight()).to.equal(2); // nesting depth is two as participants and messages do not count
        expect(Object.values(tree._tree).map(o => o.id)).to.have.all.members(ids.filter(id => [
          'Participant_1_ChoreographyTask_093vv4x',
          'Participant_2_ChoreographyTask_093vv4x',
          'Message_0bkq11l',
          'Participant_1_SubChoreography_1lywprj',
          'Participant_2_SubChoreography_1lywprj'].findIndex(x => x === id) === -1));

        expect(subChoreo.isExpanded).to.be.true;
      }));

      it('selected elements 2', inject(function(elementRegistry, copyPaste) {

        const START_EVENT_ID = 'StartEvent_0ptuctp';

        // given
        var event = elementRegistry.get(START_EVENT_ID);
        // when
        var tree = copy([event]);

        var eventDescriptor = tree.getElement(START_EVENT_ID);

        // then
        expect(tree.getHeight()).to.equal(1);
        expect(Object.values(tree.getElementsAtDepth(0)).length).to.equal(2); // Event and label

        expect(eventDescriptor.type).to.eql('bpmn:StartEvent');
      }));

    });
    describe('paste', function() {
      it('should paste twice', inject(
        function(elementRegistry, canvas, copyPaste) {
          // given
          const element = elementRegistry.get('SubChoreography_1lywprj');
          const rootElement = canvas.getRootElement();

          // when
          copyPaste.copy(element);

          copyPaste.paste({
            element: rootElement,
            point: {
              x: 1000,
              y: 100
            }
          });

          copyPaste.paste({
            element: rootElement,
            point: {
              x: 1500,
              y: 275
            }
          });

          // Due to a bug in bpmnjs, labels visual form get the root element as their parent
          // https://github.com/bpmn-io/bpmn-js/issues/945
          // thus it should be:
          // expect(rootElement.children).to.have.length(21); 25 - 4*labels
          expect(rootElement.children).to.have.length(25);

          var pastedElements = elementRegistry.filter(function(e) {
            return e !== element && is(e, 'bpmn:SubChoreography') && e.businessObject.name === 'ExpandedSubChoreo';
          });
          expect(element.children).to.have.length(9);
          expect(pastedElements[0].children).to.have.length(7); // Due to the bug some labels are now root's children
          expect(pastedElements[1].children).to.have.length(7);
          expect(pastedElements[0].id).not.to.equal(pastedElements[1].id).not.to.equal('SubChoreography_1lywprj');
        }
      ));

      it('should keep participants but chang bands', inject(
        function(elementRegistry, canvas, copyPaste) {
          // given
          const element = elementRegistry.get('ChoreographyTask_1jjb8x4');
          const rootElement = canvas.getRootElement();

          // when
          copyPaste.copy(element);

          copyPaste.paste({
            element: rootElement,
            point: {
              x: 1000,
              y: 100
            }
          });

          var pastedElement = elementRegistry.filter(function(e) {
            return e !== element && is(e, 'bpmn:ChoreographyTask') && e.businessObject.name === 'Activity';
          })[0];
          // eql = deep equal
          expect(pastedElement.businessObject.particpantRef).to.eql(element.businessObject.particpantRef);
          expect(pastedElement.businessObject.initiatingParticipantRef).to.equal(element.businessObject.initiatingParticipantRef);
          expect(pastedElement.bandShapes).to.not.eql(element.bandShapes);

          for (let i = 0; i < pastedElement.bandShapes.length; i++) {
            expect(pastedElement.bandShapes[i].businessObject).to.equal(element.bandShapes[i].businessObject);
            expect(pastedElement.bandShapes[i].activityShape).to.equal(pastedElement);
            expect(pastedElement.bandShapes[i].diBand).to.not.eql(element.bandShapes[i].diBand);
            expect(pastedElement.bandShapes[i].diBand.choreographyActivityShape).to.equal(pastedElement.businessObject.di);
          }

        }
      ));

      it('should create new message flow', inject(
        function(elementRegistry, canvas, copyPaste) {
          // given
          const element = elementRegistry.get('ChoreographyTask_1jjb8x4');
          const rootElement = canvas.getRootElement();

          // when
          copyPaste.copy(element);

          copyPaste.paste({
            element: rootElement,
            point: {
              x: 1000,
              y: 100
            }
          });

          var pastedElement = elementRegistry.filter(function(e) {
            return e !== element && is(e, 'bpmn:ChoreographyTask') && e.businessObject.name === 'Activity';
          })[0];
          // eql = deep equal
          expect(pastedElement.businessObject.messageFlowRef).to.not.eql(element.businessObject.messageFlowRef);
          expect(pastedElement.businessObject.messageFlowRef[0].$parent).to.equal(element.businessObject.messageFlowRef[0].$parent);
          expect(pastedElement.businessObject.messageFlowRef[0].sourceRef).to.equal(element.businessObject.messageFlowRef[0].sourceRef);
          expect(pastedElement.businessObject.messageFlowRef[0].targetRef).to.equal(element.businessObject.messageFlowRef[0].targetRef);
          expect(pastedElement.businessObject.messageFlowRef[0].messageRef).to.not.eql(element.businessObject.messageFlowRef[0].messageRef);
          expect(pastedElement.businessObject.messageFlowRef[0].messageRef.id).to.not.equal(element.businessObject.messageFlowRef[0].messageRef.id);
          expect(pastedElement.bandShapes[0].children[0].id).not.to.equal(element.bandShapes[0].children[0].id);
          expect(pastedElement.bandShapes[0].children[0].parent).to.equal(pastedElement.bandShapes[0]);

        }
      ));

      it('should undo and redo', inject(integrationTest(['ChoreographyTask_1jjb8x4'])));
    });

  });

});

// test helpers //////////////////////

function integrationTest(ids) {

  return function(canvas, elementRegistry, modeling, copyPaste, commandStack) {
    // given
    var shapes = elementRegistry.getAll();
    let rootElement;

    var initialContext = {
      type: mapProperty(shapes, 'type'),
      ids: mapProperty(shapes, 'id'),
      length: shapes.length,
      sequenceFlowLenght: elementRegistry.filter(function(element) {
        return is(element, 'bpmn:SequenceFlow');
      }).length,
      messageLength: elementRegistry.filter(function(element) {
        return is(element, 'bpmn:Message');
      }).length
    };

    var elements = map(ids, function(id) {
      return elementRegistry.get(id);
    });

    copyPaste.copy(elements);

    modeling.removeElements(elements);

    rootElement = canvas.getRootElement();

    copyPaste.paste({
      element: rootElement,
      point: {
        x: 1100,
        y: 250
      }
    });

    elements = elementRegistry.getAll();

    // remove root
    elements = elementRegistry.filter(function(element) {
      return !!element.parent;
    });

    modeling.moveElements(elements, { x: 50, y: -50 });

    // when
    commandStack.undo();
    commandStack.undo();
    commandStack.undo();

    elements = elementRegistry.getAll();

    let currentContext = {
      type: mapProperty(elements, 'type'),
      ids: mapProperty(elements, 'id'),
      length: elements.length
    };

    // then
    expect(initialContext).to.have.length(currentContext.length);

    expectCollection(initialContext.ids, currentContext.ids, true);

    // when
    commandStack.redo();
    commandStack.redo();
    commandStack.redo();

    elements = elementRegistry.getAll();

    currentContext = {
      type: mapProperty(elements, 'type'),
      ids: mapProperty(elements, 'id'),
      length: elements.length,
      sequenceFlowLenght: elementRegistry.filter(function(element) {
        return is(element, 'bpmn:SequenceFlow');
      }).length,
      messageLength: elementRegistry.filter(function(element) {
        return is(element, 'bpmn:Message');
      }).length
    };
    // then
    // Some sequence flows might have been deleted
    const sequenceFlowDiff = initialContext.sequenceFlowLenght - currentContext.sequenceFlowLenght;
    // Due to some unintended behaviour some messages where part of
    expect(currentContext).to.have.length(initialContext.length - sequenceFlowDiff);

    expectCollection(initialContext.type, currentContext.type, true);
    expectCollection(initialContext.ids, currentContext.ids, false);
  };
}

/**
 * Copy elements (or elements with given ids).
 *
 * @param {Array<String|djs.model.Base} ids
 *
 * @return {DescriptorTree}
 */
function copy(ids) {
  return getChorJS().invoke(function(copyPaste, elementRegistry) {

    var elements = ids.map(function(e) {
      var element = elementRegistry.get(e.id || e);

      expect(element).to.exist;

      return element;
    });

    var copyResult = copyPaste.copy(elements);

    return new DescriptorTree(copyResult);
  });
}

function mapProperty(shapes, prop) {
  return map(shapes, function(shape) {
    return shape[prop];
  });
}

function expectCollection(collA, collB, contains) {

  forEach(collB, function(element) {
    if (!element.parent) {
      return;
    }

    if (contains) {
      expect(collA).to.contain(element);
    } else {
      expect(collA).not.to.contain(element);
    }
  });
}
