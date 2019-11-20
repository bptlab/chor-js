let shapeCache = {};

/**
 * Sets the underlying model of the viewer.
 * The model must be given in a serialized BPMN2 XML string format.
 *
 * @param {Object} viewer the viewer to which to attach the parsed XML to
 * @param {String} xml the serialized XML string
 * @param {Object} [options] additional options
 * @return {Promise} a promise resolving with the parsed XML
 */
export function setXML(viewer, xml, options) {
  return new Promise((resolve, reject) => {
    // clear old diagram if there is one and clear the cache
    if (viewer._definitions) {
      viewer.clear();
    }
    shapeCache = {};

    // load new XML, passing it to the event bus appropriately
    xml = viewer._emit('import.parse.start', { xml: xml }) || xml;
    viewer._moddle.fromXML(xml, 'bpmn:Definitions', function(error, definitions, context) {
      definitions = viewer._emit('import.parse.complete', {
        error: error,
        definitions: definitions,
        context: context
      }) || definitions;

      if (error) {
        viewer._emit('import.done', { error });
        throw new Error(error);
      } else {
        let output = { definitions: definitions, warnings: context.warnings };
        viewer._emit('import.done', output);
        viewer._definitions = definitions;
        resolve(output);
      }
    });
  });
}

/**
 * Sets the underlying model of the viewer.
 * The model must be given as parsed definitions object from bpmn-moddle.
 *
 * @param {Object} viewer the viewer to which to attach the definitions to
 * @param {String} definitions the definitions object
 * @param {Object} [options] additional options
 */
export function setDefinitions(viewer, definitions, options) {
  return new Promise((resolve, reject) => {
    // clear old diagram if there is one and clear the cache
    if (viewer._definitions) {
      viewer.clear();
    }
    shapeCache = {};

    // change definitions and inform listeners
    viewer._definitions = definitions;
    viewer._emit('import.done');
    resolve();
  });
}

/**
 * Display a specific choreography contained in the definitions attached to a viewer.
 *
 * @param {Object} viewer the viewer to use for displaying
 * @param {Object} [options] additional options: { choreoID: string }
 * @return {Promise} a promise resolving after the rendering
 */
export function displayChoreography(viewer, options) {
  return new Promise((resolve, reject) => {
    options = options || {};
    const choreoID = options.choreoID;

    // modules
    const choreoUtil = viewer.get('choreoUtil');
    const eventBus = viewer.get('eventBus');
    const elementRegistry = viewer.get('elementRegistry');

    // only cache diagrams if we are using a modeler, i.e., the command stack module
    // is available for injection
    let useCache = true;
    let commandStack;
    try {
      commandStack = viewer.get('commandStack');
      const clipboard = viewer.get('clipboard');
      clipboard.clear();
    } catch (error) {
      useCache = false;
    }

    // local variables
    let definitions = viewer._definitions;
    let visitor;

    // if we are supposed to display a specific choreography, find it
    // note that we assume a 1-to-1 relationship between diagrams and choreographies
    const diagrams = choreoUtil.diagrams();
    const choreos = choreoUtil.choreographies();
    let diagram;
    let choreo;

    if (choreoID) {
      choreo = choreos.find(element => element.id == choreoID);
      if (!choreo) {
        throw new Error('choreography with id ' + choreoID + ' not found');
      }

      // find the associated diagram as well
      diagram = diagrams.find(element => element.plane.bpmnElement === choreo);
      if (!diagram) {
        throw new Error('no diagram found for choreography ' + choreoID);
      }
    } else {
      // otherwise, just find any choreo/diagram combination
      diagram = diagrams.find(element => element.plane && element.plane.bpmnElement && choreos.includes(element.plane.bpmnElement));
      if (!diagram) {
        throw new Error('could not find a choreography and/or diagram to display');
      }
      choreo = diagram.plane.bpmnElement;
    }

    let stack;
    let stackIdx;
    if (useCache) {
      // remember command stack values so undo/redo works event
      // after switching the diagram
      stack = commandStack._stack.slice();
      stackIdx = commandStack._stackIdx;

      // cache shapes so we do not have to rerender them later when
      // switching back to this diagram
      const currentChoreo = choreoUtil.currentChoreography();
      const allElements = elementRegistry.getAll() || [];
      if (currentChoreo) {
        shapeCache[currentChoreo.id] = allElements;
      }
    }

    // clear old diagram if there is one
    // this will clear the command stack and the canvas
    if (definitions) {
      viewer.clear();
    }

    if (useCache) {
      // restore old command stack
      commandStack._stack = stack;
      commandStack._stackIdx = stackIdx;
    }

    // inform listeners about the start of the render process
    eventBus.fire('import.render.start', {
      definitions: definitions,
      options: options
    });

    // restore diagram from cache if possible
    if (useCache && shapeCache[choreoID]) {
      visitor = viewer.get('restoreFromCacheVisitor');
      visitor.init(shapeCache[choreoID]);
    } else {
      visitor = viewer.get('initialRenderVisitor');
    }

    // we get the walker from viewer, so it can be replaced by a different one if needed.
    let walker = viewer.get('treeWalker');
    walker.setVisitor(visitor);

    // start the walker
    walker.start(choreo, diagram);
    eventBus.fire('import.render.complete');

    // legacy: the test bootstrapper will pass a callback as the options object,
    // which we have to call
    if (typeof (options) == 'function') {
      options();
    }
    return resolve();
  });
}