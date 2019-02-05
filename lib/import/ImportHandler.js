import ChoreoTreeWalker from './ChoreoTreeWalker';

/**
 * Import the definitions into a viewer.
 *
 * Errors and warnings are reported through the specified callback.
 *
 * @param  {Viewer} viewer
 * @param  {ModdleElement} definitions
 * @param  {Function} done the callback, invoked with (err, [ warning ]) once the import is done
 * @param  {String} choreoID optional ID of a specific choreography to import
 */
export function importChoreoDiagram(viewer, definitions, done, choreoID) {

  var importer,
      eventBus;

  var error,
      warnings = [];

  /**
   * Walk the diagram semantically, importing (=drawing)
   * all elements you encounter.
   *
   * @param {ModdleElement} definitions
   */
  function render(definitions) {

    var visitor = {

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

    var walker = new ChoreoTreeWalker(visitor, viewer);

    // traverse BPMN 2.0 document model,
    // starting at definitions
    walker.handleDefinitions(definitions, choreoID);
  }

  try {
    importer = viewer.get('bpmnImporter');
    eventBus = viewer.get('eventBus');

    eventBus.fire('import.render.start', { definitions: definitions });

    render(definitions);

    eventBus.fire('import.render.complete', {
      error: error,
      warnings: warnings
    });
  } catch (e) {
    error = e;
  }

  done(error, warnings);
}