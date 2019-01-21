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
  const createdByOldID = context.tree.createdElements;
  const newElements = {};
  Object.keys(createdByOldID).forEach(key => {
    newElements[createdByOldID[key].element.id] = createdByOldID[key].element;
  });

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
  Object.keys(newElements).forEach(key => {
    const elem = newElements[key];
    if (elem.copyMessageFlowRef) {
      elem.businessObject.messageFlowRef.forEach(
        flow => flow.messageRef = createdByOldID[flow.messageRef.id].element);
    }
  });
  console.log(createdByOldID);
  console.log('done');
};


