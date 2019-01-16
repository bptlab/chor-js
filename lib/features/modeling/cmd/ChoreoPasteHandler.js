import inherits from 'inherits';
import PasteHandler from 'diagram-js/lib/features/modeling/cmd/PasteHandler';
import { is } from 'bpmn-js/lib/util/ModelUtil';


/**
 * A handler that implements pasting of elements onto the diagram.
 *
 * @param injector
 */
export default function ChoreoPasteHandler(injector) {
  injector.invoke(PasteHandler, this);
}

inherits(ChoreoPasteHandler, PasteHandler);

ChoreoPasteHandler.$inject = [
  'injector'
];


// api //////////////////////

/**
 * Reconnect bands to their activities.
 * @param context
 */
ChoreoPasteHandler.prototype.postExecute = function(context) {
  PasteHandler.prototype.postExecute.call(this, context);
  console.log(context);
  const newElements = {};
  Object.keys(context.tree.createdElements).forEach(key => {
    newElements[context.tree.createdElements[key].element.id] = context.tree.createdElements[key].element;
  });

  // reestablish bandShapes
  Object.keys(newElements).forEach(key => {
    const elem = newElements[key];
    if (is(elem.businessObject, 'bpmn:Participant')) {
      const activity = newElements[elem.activityShape.id];
      if (!activity.bandShapes) {
        activity.bandShapes = [];
      }
      const offset = activity.bandShapesParticipantIDs.findIndex(id => id === elem.businessObject.id);
      if (offset < 0) {
        throw new Error('BandShapes array could not be reconstructed');
      }
      activity.bandShapes[offset] = elem;
    }
  });
  console.log('done');
};


