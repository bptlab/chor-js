import { is } from 'bpmn-js/lib/util/ModelUtil';

const HIGH_PRIORITY = 2000;

/**
 * Overwrites BpmnDiOrdering because that is incompatible with participant bands and multiple diagrams contained
 * in one bpmn file. In §12.2.1 on p. 368 of the standard v. 2.0.2 it is mentioned that the DI of elements that appear
 * above another element must appear after that element's DI. Though it is not quite clear,
 * through the examples in chapter 12 it appears that this only really has to be the case if the shapes
 * actually overlap. To be on the safe side, we do a bfs tree traversal of each diagram starting with the root choreo.
 * @param eventBus
 * @param canvas
 * @param choreoUtil
 * @constructor
 */
export default function ChoreoDiOrdering(eventBus, canvas, choreoUtil) {

  eventBus.on('saveXML.start', HIGH_PRIORITY, orderDi);

  function getOrderedPlaneElement(businessObject) {
    const choreographyDIs = choreoUtil.diagrams().map(d => d.plane);
    const plane = choreographyDIs.find(p => p.bpmnElement === businessObject); // the di for the choreographies is not necessarily set if they have not been loaded, thus this detour;
    let childrenDIs = getChildrenAndParticipantDIs(businessObject, plane.planeElement || []);
    return childrenDIs;
  }

  /**
   * Returns a shallow copy of the definitions object that has the planeElement array for each diagram ordered correctly.
   * @param context
   * @returns {*}
   */
  function orderDi(context) {
    /*
    We create a shallow copy of the definitions object because we need to reorder the diagram.plane.planeElement array
    that contains the DI objects of the diagram. Because some other parts of the code might assume that the order stays
    the same,e.g., some revert functionality that might simply pop the last element and because the saveXML command
    family does not carry the context through its lifecycle which prevents us from setting the array back to its
    original value, I believe it is safer to do this somewhat cumbersome manual copy.
    We have to manually copy most of the attributes prefixed with $ because they are not enumerable.
    */
    const definitions = context.definitions;
    const definitionsShallowCopy = Object.assign({}, context.definitions);
    definitionsShallowCopy.$attrs = definitions.$attrs;
    definitionsShallowCopy.$parent = definitions.$parent;
    definitionsShallowCopy.__proto__ = definitions.__proto__;

    definitionsShallowCopy.diagrams = definitions.diagrams.map(d => {
      const dCopy = Object.assign({},d);
      dCopy.$attrs = d.$attrs;
      dCopy.$parent = d.$parent;
      dCopy.__proto__ = d.__proto__;

      dCopy.plane = Object.assign({}, dCopy.plane);
      dCopy.plane.$attrs = d.plane.$attrs;
      dCopy.plane.$parent = d.plane.$parent;
      dCopy.plane.bpmnElement = d.plane.bpmnElement;
      dCopy.plane.__proto__ = d.plane.__proto__;

      dCopy.plane.planeElement = getOrderedPlaneElement(dCopy.plane.bpmnElement);
      return dCopy;
    });

    context.definitions = definitionsShallowCopy;
    return definitionsShallowCopy;
  }
}

/**
 * Do a bfs on the given choreography businessObject to get the di of all its children including participant bands.
 * We cannot use #selfAndChildren here because that only works on shape elements and diagrams that are not shown currently
 * do not have shape objects.
 * @param choreography
 * @param planeElements
 */
function getChildrenAndParticipantDIs(choreography, planeElements) {
  let children = [].concat(choreography.flowElements || [], choreography.artifacts || []);
  let orderedDIs = [];
  while (children.length > 0) {
    const nextBusinessObject = children.shift();
    const nextDi = planeElements.find(p => p.bpmnElement === nextBusinessObject); // Di might not be set yet for element
    orderedDIs.push(nextDi);
    if (is(nextBusinessObject, 'bpmn:ChoreographyActivity')) {
      const participantDIs = planeElements
        .filter(di => !!di.choreographyActivityShape)
        .filter(di => di.choreographyActivityShape === nextDi);
      orderedDIs = orderedDIs.concat(participantDIs);
    }
    if (nextBusinessObject.flowElements) {
      children = children.concat(nextBusinessObject.flowElements);
    }
    if (nextBusinessObject.artifacts) {
      children = children.concat(nextBusinessObject.artifacts);
    }
  }
  return orderedDIs;
}


ChoreoDiOrdering.$inject = ['eventBus', 'canvas', 'choreoUtil'];
