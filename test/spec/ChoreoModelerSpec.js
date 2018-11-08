import '../TestHelper';

import TestContainer from 'mocha-test-container-support';

import ChoreoModeler from '../../app/choreo-modeler';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';


describe('custom modeler', function() {

  //var xml = require('./diagram.bpmn');

  var container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });


  describe('custom elements', function() {

    var modeler;

    // spin up modeler with custom element before each test
    beforeEach(function(done) {

      modeler = new ChoreoModeler({ container: container });

      // modeler.importXML(xml, function(err) {
      //   if (!err) {
      //     done();
      //   }
      // });

      done();

    });

    it('should run', function() {
    });

    xit('should import custom element', function() {

      // given
      var elementRegistry = modeler.get('elementRegistry'),
          customElements = modeler.getCustomElements();

      // when
      var customElement = {
        type: 'custom:triangle',
        id: 'CustomTriangle_1',
        x: 300,
        y: 200
      };

      modeler.addCustomElements([ customElement ]);
      var customTriangle = elementRegistry.get('CustomTriangle_1');

      // then
      expect(is(customTriangle, 'custom:triangle')).to.be.true;

      expect(customTriangle).to.exist;
      expect(customElements).to.contain(customElement);

    });

  });

});
