import ChoreoTreeWalker from './ChoreoTreeWalker';

/**
 * @param {Object} viewer the viewer to which to attach the parsed XML to
 * @param {String} xml the serialized XML string
 * @param {Object} [options] additional options
 * @return {Promise} a promise resolving with the parsed XML
 */
export function setXML(viewer, xml, options) {
  return new Promise((resolve, reject) => {
    // clear old diagram if there is one
    try {
      if (viewer._definitions) {
        viewer.clear();
      }
    } catch (e) {
      return reject(e);
    }

    // load new XML, passing it to the event bus appropriately
    xml = viewer._emit('import.parse.start', { xml: xml }) || xml;
    viewer._moddle.fromXML(xml, 'bpmn:Definitions', function(error, definitions, context) {
      definitions = viewer._emit('import.parse.complete', {
        error: error,
        definitions: definitions,
        context: context
      }) || definitions;

      if (error) {
        let output = { error: error, warnings: context.warnings };
        viewer._emit('import.done', output);
        reject(output);
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
 * Displays a specific choreography contained in the definitions attached to a viewer.
 *
 * @param {Object} viewer the viewer to use for displaying
 * @param {Object} [options] additional options: { choreoID: string }
 * @return {Promise} a promise resolving after the rendering
 */
export function displayChoreography(viewer, options) {
  return new Promise((resolve, reject) => {
    options = options || {};
    let definitions = viewer._definitions;

    // clear old diagram if there is one
    try {
      if (definitions) {
        viewer.clear();
      }
    } catch (e) {
      return reject(e);
    }

    // try to render the choreography
    try {
      let importer = viewer.get('bpmnImporter');
      let eventBus = viewer.get('eventBus');
      let error;
      let warnings = [];

      eventBus.fire('import.render.start', {
        definitions: definitions,
        options: options
      });

      // this visitor will be called by the tree walker at specific points in
      // the definitions tree, calling the importer
      let visitor = {
        root: function(element) {
          return importer.add(element);
        },
        element: function(element, parentShape) {
          return importer.add(element, parentShape);
        },
        error: function(message, context) {
          warnings.push({ message: message, context: context });
        }
      };

      // create the walker and start it
      let walker = new ChoreoTreeWalker(visitor, viewer);
      walker.handleDefinitions(definitions, options.choreoID);

      // notify listeners of the completed import
      let output = {
        error: error,
        warnings: warnings
      };
      eventBus.fire('import.render.complete', output);

      return resolve(output);
    } catch (error) {
      return reject({ error: error });
    }
  });
}