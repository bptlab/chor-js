import {
  forEach
} from 'min-dash';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import Refs from 'object-refs';

import {
  elementToString
} from 'bpmn-js/lib/import/Util';

var diRefs = new Refs(
  { name: 'bpmnElement', enumerable: true },
  { name: 'di', configurable: true }
);

export default function ChoreoTreeWalker(handler, injector) {

  var translate = injector.get('translate');

  // list of containers already walked
  var handledElements = {};

  // list of elements to handle deferred to ensure
  // prerequisites are drawn
  var deferred = [];

  // Helpers //////////////////////

  function contextual(fn, ctx) {
    return function(e) {
      fn(e, ctx);
    };
  }

  function handled(element) {
    handledElements[element.id] = element;
  }

  function visit(element, ctx) {

    var gfx = element.gfx;

    // avoid multiple rendering of elements
    if (gfx) {
      throw new Error(
        translate('already rendered {element}', { element: elementToString(element) })
      );
    }

    // call handler
    return handler.element(element, ctx);
  }

  function visitRoot(element, diagram) {
    return handler.root(element, diagram);
  }

  function visitIfDi(element, ctx) {

    try {
      var gfx = element.di && visit(element, ctx);

      handled(element);

      return gfx;
    } catch (e) {
      handler.error(e.message, { element: element, error: e });

      console.error(translate('failed to import {element}', { element: elementToString(element) }));
      console.error(e);
    }
  }

  // DI handling //////////////////////

  function registerDi(di) {
    var bpmnElement = di.bpmnElement;

    if (bpmnElement) {
      // do not link DIs for participants because they have more than one
      if (!is(bpmnElement, 'bpmn:Participant')) {
        if (bpmnElement.di) {
          handler.error(
            translate('multiple DI elements defined for {element}', {
              element: elementToString(bpmnElement)
            }),
            { element: bpmnElement }
          );
        } else {
          diRefs.bind(bpmnElement, 'di');
          bpmnElement.di = di;
        }
      }
    } else {
      handler.error(
        translate('no bpmnElement referenced in {element}', {
          element: elementToString(di)
        }),
        { element: di }
      );
    }
  }

  // Semantic handling //////////////////////

  /**
   * Handle definitions and return the rendered diagram (if any).
   *
   * @param {ModdleElement} definitions to walk and import
   * @param {ModdleElement} [choreoID] ID of specific diagram to import and display
   *
   * @throws {Error} if no diagram to display could be found
   */
  function handleDefinitions(definitions, choreoID) {
    let diagrams = definitions.diagrams || [];
    let choreos = definitions.rootElements.filter(element => is(element, 'bpmn:Choreography')) || [];
    let choreo;
    let diagram;

    // if we are supposed to display a specific choreography, find it
    // note that we assume a 1-to-1 relationship between diagrams and choreographies
    if (choreoID) {
      choreo = choreos.find(element => element.id == choreoID);
      if (!choreo) {
        throw new Error(translate('choreography with id ' + choreoID + ' not found'));
      }

      // find the associated diagram as well
      diagram = diagrams.find(element => element.plane.bpmnElement === choreo)
      if (!diagram) {
        throw new Error(translate('no diagram found for choreography ' + choreoID));
      }
    } else {
      // otherwise, just find any choreo/diagram combination
      diagram = diagrams.find(element => element.plane && element.plane.bpmnElement && choreos.includes(element.plane.bpmnElement));
      if (!diagram) {
        throw new Error(translate('could not find a choreography and/or diagram to display'));
      }
      choreo = diagram.plane.bpmnElement;
    }

    // load DI from selected diagram
    registerDi(diagram.plane);
    diagram.plane.planeElement.forEach(registerDi);

    // traverse semantic tree
    var ctx = visitRoot(choreo, diagram.plane);
    handleChoreography(choreo, ctx);
    handleDeferred(deferred);
  }

  function handleDeferred() {

    var fn;

    // drain deferred until empty
    while (deferred.length) {
      fn = deferred.shift();
      fn();
    }
  }

  function handleChoreography(choreo, context) {
    handleFlowElementsContainer(choreo, context);
    handleArtifacts(choreo.artifacts, context);

    // log choreography handled
    handled(choreo);
  }

  function handleSubChoreography(choreo, context) {
    handleFlowElementsContainer(choreo, context);
    handleArtifacts(choreo.artifacts, context);

    // log sub-choreography handled
    handled(choreo);
  }

  function handleChoreographyActivity(activity, context) {
    // handle participants
    forEach(activity.participantRef, contextual(handleParticipant, context));
  }

  function handleParticipant(participant, context) {
    let childCtx = visit(participant, context);

    if (is(context, 'bpmn:ChoreographyTask')) {
      let task = context.businessObject;
      task.get('messageFlowRef').forEach(messageFlow => {
        if (messageFlow.messageRef && messageFlow.sourceRef === participant) {
          visit(messageFlow.messageRef, childCtx);
        }
      });
    }
  }

  function handleArtifact(artifact, context) {

    // bpmn:TextAnnotation
    // bpmn:Group
    // bpmn:Association

    visitIfDi(artifact, context);
  }

  function handleArtifacts(artifacts, context) {

    forEach(artifacts, function(e) {
      if (is(e, 'bpmn:Association')) {
        deferred.push(function() {
          handleArtifact(e, context);
        });
      } else {
        handleArtifact(e, context);
      }
    });
  }

  function handleFlowNode(flowNode, context) {
    var childCtx = visitIfDi(flowNode, context);

    if (is(flowNode, 'bpmn:SubChoreography')) {
      handleSubChoreography(flowNode, childCtx || context);
    }

    if (is(flowNode, 'bpmn:ChoreographyActivity')) {
      handleChoreographyActivity(flowNode, childCtx || context);
    }
  }

  function handleSequenceFlow(sequenceFlow, context) {
    visitIfDi(sequenceFlow, context);
  }

  function handleBoundaryEvent(dataObject, context) {
    visitIfDi(dataObject, context);
  }

  function handleFlowElementsContainer(container, context) {
    handleFlowElements(container.flowElements, context);
  }

  function handleFlowElements(flowElements, context) {
    forEach(flowElements, function(e) {
      if (is(e, 'bpmn:SequenceFlow')) {
        deferred.push(function() {
          handleSequenceFlow(e, context);
        });
      } else if (is(e, 'bpmn:BoundaryEvent')) {
        deferred.unshift(function() {
          handleBoundaryEvent(e, context);
        });
      } else if (is(e, 'bpmn:FlowNode')) {
        handleFlowNode(e, context);
      } else {
        handler.error(
          translate('unrecognized flowElement {element} in context {context}', {
            element: elementToString(e),
            context: (context ? elementToString(context.businessObject) : 'null')
          }),
          { element: e, context: context }
        );
      }
    });
  }

  // API //////////////////////

  return {
    handleDeferred: handleDeferred,
    handleDefinitions: handleDefinitions,
    registerDi: registerDi
  };
}