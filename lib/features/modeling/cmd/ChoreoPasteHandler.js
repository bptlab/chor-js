import inherits from 'inherits';
import PasteHandler from 'diagram-js/lib/features/modeling/cmd/PasteHandler';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { createMessageFlow, linkMessageFlowSemantics } from '../../../util/MessageUtil';


/**
 * A handler that implements pasting of elements onto the diagram.
 *
 * @param injector
 */
export default function ChoreoPasteHandler(injector) {
  injector.invoke(PasteHandler, this);
  this._injector = injector;
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
ChoreoPasteHandler.prototype.execute = function(context) {
  const createdByOldID = context.tree.createdElements;
  const newElements = {};
  Object.keys(createdByOldID).forEach(key => {
    newElements[createdByOldID[key].element.id] = createdByOldID[key].element;
  });

  const planeElement = this._injector.get('canvas').getRootElement().businessObject.di.planeElement;

  // Here we relink the bandShapes and messages
  Object.keys(newElements).forEach(key => {
    const elem = newElements[key];

    if (is(elem.businessObject, 'bpmn:Participant')) {
      const activity = newElements[elem.activityShape.id];
      if (!activity.bandShapes) {
        activity.bandShapes = [];
      }
      const offset = activity.businessObject.participantRef.map(p=>p.id)
        .findIndex(id => id === elem.businessObject.id);
      if (offset < 0) {
        throw new Error('BandShapes array could not be reconstructed');
      }
      planeElement.push(elem.diBand);
      elem.diBand.$parent = context.topParent.businessObject.di;
      activity.bandShapes[offset] = elem;
    }
  });
  // Bands need to go first
  Object.keys(newElements).forEach(key => {
    const elem = newElements[key];
    if (is(elem.businessObject, 'bpmn:ChoreographyTask')) {
      elem.copyMessageFlowRef.forEach(flow => {
        const newMessageFlow = createMessageFlow(this._injector,
          createdByOldID[flow.messageRef.id].element.businessObject, flow.sourceRef, flow.targetRef);
        linkMessageFlowSemantics(this._injector, elem.businessObject, newMessageFlow);
      });
    }
  });
};
