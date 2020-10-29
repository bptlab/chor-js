let shapeCache = {};

/**
 * Clear the cached shapes. This function should be called when loading a new diagram,
 * since the old cache might lead to errors if elements with the same IDs are encountered.
 */
export function clearShapeCache() {
  shapeCache = {};
}

/**
 * Display a specific choreography contained in the definitions attached to a viewer.
 *
 * @param {Object} viewer the viewer to use for displaying
 * @param {Object} [bpmnDiagramOrId] diagram or ID of the diagram to display
 * @return {Promise} a promise resolving after the rendering
 */
export function displayChoreography(viewer, bpmnDiagramOrId) {
  return new Promise((resolve, reject) => {
    let choreoID = bpmnDiagramOrId;
    if (typeof choreoID === 'object') {
      choreoID = choreoID.id;
    }

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
        reject(new Error('choreography with id ' + choreoID + ' not found'));
      }

      // find the associated diagram as well
      diagram = diagrams.find(element => element.plane.bpmnElement === choreo);
      if (!diagram) {
        reject(new Error('no diagram found for choreography ' + choreoID));
      }
    } else {
      // otherwise, just find any choreo/diagram combination
      diagram = diagrams.find(element => element.plane && element.plane.bpmnElement && choreos.includes(element.plane.bpmnElement));
      if (!diagram) {
        reject(new Error('could not find a choreography and/or diagram to display'));
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
      definitions: definitions
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

    return resolve([]);
  });
}