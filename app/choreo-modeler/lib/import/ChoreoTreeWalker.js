import {
  find,
  forEach
} from 'min-dash';

import Refs from 'object-refs';

import {
  elementToString
} from 'bpmn-js/lib/import/Util';

var diRefs = new Refs(
  { name: 'bpmnElement', enumerable: true },
  { name: 'di', configurable: true }
);

/**
 * Returns true if an element has the given meta-model type
 *
 * @param  {ModdleElement}  element
 * @param  {String}         type
 *
 * @return {Boolean}
 */
function is(element, type) {
  return element.$instanceOf(type);
}

/**
 * Find a suitable display candidate for definitions where the DI does not
 * correctly specify one.
 */
function findDisplayCandidate(definitions) {
  return find(definitions.rootElements, function(e) {
    return is(e, 'bpmn:Choreography');
  });
}

export default function ChoreoTreeWalker(handler, translate) {

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
      logError(e.message, { element: element, error: e });

      console.error(translate('failed to import {element}', { element: elementToString(element) }));
      console.error(e);
    }
  }

  function logError(message, context) {
    handler.error(message, context);
  }

  // DI handling //////////////////////

  function registerDi(di) {
    var bpmnElement = di.bpmnElement;

    if (bpmnElement) {
      if (bpmnElement.di) {
        logError(
          translate('multiple DI elements defined for {element}', {
            element: elementToString(bpmnElement)
          }),
          { element: bpmnElement }
        );
      } else {
        diRefs.bind(bpmnElement, 'di');
        bpmnElement.di = di;
      }
    } else {
      logError(
        translate('no bpmnElement referenced in {element}', {
          element: elementToString(di)
        }),
        { element: di }
      );
    }
  }

  function handleDiagram(diagram) {
    handlePlane(diagram.plane);
  }

  function handlePlane(plane) {
    registerDi(plane);

    forEach(plane.planeElement, handlePlaneElement);
  }

  function handlePlaneElement(planeElement) {
    registerDi(planeElement);
  }


  // Semantic handling //////////////////////

  /**
   * Handle definitions and return the rendered diagram (if any)
   *
   * @param {ModdleElement} definitions to walk and import
   * @param {ModdleElement} [diagram] specific diagram to import and display
   *
   * @throws {Error} if no diagram to display could be found
   */
  function handleDefinitions(definitions, diagram) {
    // make sure we walk the correct bpmnElement

    var diagrams = definitions.diagrams;

    if (diagram && diagrams.indexOf(diagram) === -1) {
      throw new Error(translate('diagram not part of bpmn:Definitions'));
    }

    if (!diagram && diagrams && diagrams.length) {
      diagram = diagrams[0];
    }

    // no diagram -> nothing to import
    if (!diagram) {
      throw new Error(translate('no diagram to display'));
    }

    // load DI from selected diagram only
    handleDiagram(diagram);


    var plane = diagram.plane;

    if (!plane) {
      throw new Error(translate(
        'no plane for {element}',
        { element: elementToString(diagram) }
      ));
    }

    var rootElement = plane.bpmnElement;

    // ensure we default to a suitable display candidate (choreography),
    // even if non is specified in DI
    if (!rootElement) {
      rootElement = findDisplayCandidate(definitions);

      if (!rootElement) {
        throw new Error(translate('no choreography to display'));
      } else {

        logError(
          translate('correcting missing bpmnElement on {plane} to {rootElement}', {
            plane: elementToString(plane),
            rootElement: elementToString(rootElement)
          })
        );

        // correct DI on the fly
        plane.bpmnElement = rootElement;
        registerDi(plane);
      }
    }


    var ctx = visitRoot(rootElement, plane);

    if (is(rootElement, 'bpmn:Choreography')) {
      handleChoreography(rootElement, ctx);
    } else {
      throw new Error(
        translate('unsupported bpmnElement for {plane}: {rootElement}', {
          plane: elementToString(plane),
          rootElement: elementToString(rootElement)
        })
      );
    }

    // handle all deferred elements
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
    forEach(activity.participantRefs, contextual(visit, context));
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
        logError(
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