import { bootstrapChorModeler, getChorJS, inject } from '../TestHelper';
import { selfAndAllChildren } from 'diagram-js/lib/util/Elements';

describe('feature/di-ordering', function() {

  describe('nested subchoreos', function() {
    /*
    The elements in nested.bpmn have been given names according to their z-index. The lowest have index -1 for the
    choreo itself the highest have index 2. Participant bands have note been assigned levels their level needs to be
    determined through their choreographyActivityShape.
    */
    const nestedXML = require('../resources/nested.bpmn');
    let _eventBus, _commandStack;
    beforeEach(bootstrapChorModeler(nestedXML));
    beforeEach(inject(function(eventBus, commandStack) {
      _eventBus = eventBus;
      _commandStack = commandStack;
    }));
    it('places di elements in correct order', function() {
      /* This test loads an incorrectly ordered bpmn file and orders it correctly on export.
      * We ensure that by then checking for each element in the exported xml that it appears after
      * its parent which we get by querying the diagram.
      */
      return getChorJS().saveXML({ format: true }).then(function(result) {

        var xml = result.xml;

        // match the bpmnElement belonging to the DI and optionally the choreoActivityShape for participants
        var pattern = /id="([^"]+)".*bpmnElement="([^"]+)"(?:.*choreographyActivityShape="([^"]+)")?/g,
            exportedOrder = [],
            match = pattern.exec(xml);

        while (match !== null) {
          const diID = match[1];
          const businessObjectId = match[2];
          /*
          If a third match is given it is a participant band which should be one the same level as its activty.
          However, this is not entirely clear from the standard. Technically, they are on top, yet, on page 422 they
          appear before elements which are on a lower layer.
           */
          const choreographyActivityShape = match[3];
          exportedOrder.push({ diID: diID, boID: businessObjectId, csID: choreographyActivityShape });
          // Todo check that activity appears before band
          match = pattern.exec(xml);
        }
        expect(exportedOrder).to.have.length(50);
        expect(exportedOrder[0].boID).to.equal('Choreography.-1');
        expect(exportedOrder[39].boID).to.equal('SecondChoreography.-1');
        const firstDiagram = exportedOrder.slice(0,39);
        const secondDiagram = exportedOrder.slice(39, 50);

        function checkDiOrder(e,elementIndex, exportedOrder) {
          if (e.csID) {
            const activityIndex = exportedOrder.findIndex(exported => exported.diID === e.csID);
            expect(activityIndex).to.be.below(elementIndex,
              e.diID + ' came before parent ' + e.csID + ' in xml.');
          } else {
            const registry = getChorJS().get('elementRegistry');
            const element = registry.get(e.boID);
            const selfAndChildren = selfAndAllChildren([element], false);
            selfAndChildren.forEach(c => {
              const childIndex = exportedOrder.findIndex(exported => exported.boID === c.boID);
              expect(childIndex).to.be.at.most(elementIndex,
                c.businessObject.id + ' came after parent ' + e.diID + ' in xml.');
            });
          }
        }

        firstDiagram.forEach(checkDiOrder);
        // We need to switch the diagram here to ensure that we get an update elementRegistry
        _commandStack.execute('choreography.switch', {
          id: 'SecondChoreography.-1'
        });
        secondDiagram.forEach(checkDiOrder);
      });
    });
  });

});
