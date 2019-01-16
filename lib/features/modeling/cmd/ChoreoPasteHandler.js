import inherits from 'inherits';
import PasteHandler from 'diagram-js/lib/features/modeling/cmd/PasteHandler';
import { is } from 'bpmn-js/lib/util/ModelUtil';


/**
 * A handler that implements pasting of elements onto the diagram.
 *
 * @param elementRegistry
 * @param moddle
 * @param injector
 */
export default function ChoreoPasteHandler(elementRegistry, moddle, injector) {
  this._moddle = moddle;
  this._elementRegistry = elementRegistry;
  injector.invoke(PasteHandler, this);
}

inherits(ChoreoPasteHandler, PasteHandler);

ChoreoPasteHandler.$inject = [
  'elementRegistry',
  'moddle',
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
      this._elementRegistry.updateId(elem, this._moddle.ids.nextPrefixed('ParticipantBand_', elem.businessObject));
      //elem.id = elem.future_id;
      //delete elem.future_id;
      if (!activity.bandShapes) {
        activity.bandShapes = [];
      }
      const offset = activity.oldBandShapes.findIndex(band => band.businessObject === elem.businessObject);
      activity.bandShapes[offset] = elem;
    }
  });

};


