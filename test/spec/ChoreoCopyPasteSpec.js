/* global sinon */

import {
  bootstrapChorModeler,
  getChorJS,
  inject
} from '../TestHelper';


import bpmnCopyPasteModule from '../../lib/features/copy-paste';
import copyPasteModule from 'diagram-js/lib/features/copy-paste';
import tooltipsModule from 'diagram-js/lib/features/tooltips';
import modelingModule from '../../lib/features/modeling';
import coreModule from '../../lib/core';

import {
  map,
  filter,
  forEach,
  uniqueBy
} from 'min-dash';

import DescriptorTree from './DescriptorTree';

import { is } from 'bpmn-js/lib/util/ModelUtil';


describe('features/copy-paste', function() {

  var testModules = [
    bpmnCopyPasteModule,
    copyPasteModule,
    tooltipsModule,
    modelingModule,
    coreModule
  ];

  const basicXML = require('../resources/AllChoreoTypes.bpmn');


  describe('basic diagram', function() {

    beforeEach(bootstrapChorModeler(basicXML));


    describe('copy', function() {

      it('selected elements', inject(function(elementRegistry, copyPaste) {

        // when
        var tree = copy(['SubChoreography_1lywprj']);

        var subProcess = tree.getElement('SubProcess_1kd6ist');

        // then
        expect(tree.getLength()).to.equal(3);

        expect(tree.getDepthLength(0)).to.equal(1);
        expect(tree.getDepthLength(1)).to.equal(3);
        expect(tree.getDepthLength(2)).to.equal(12);

        expect(subProcess.isExpanded).to.be.true;
      }));


    });
  });

});


// test helpers //////////////////////


function integrationTest(ids) {

  return function(canvas, elementRegistry, modeling, copyPaste, commandStack) {
    // given
    var shapes = elementRegistry.getAll(),
      rootElement;

    var initialContext = {
        type: mapProperty(shapes, 'type'),
        ids: mapProperty(shapes, 'id'),
        length: shapes.length
      },
      currentContext;

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

    currentContext = {
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
      length: elements.length
    };

    // then
    expect(initialContext).to.have.length(currentContext.length);

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
  expect(collA).to.have.length(collB.length);

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
