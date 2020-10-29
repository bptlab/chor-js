import inherits from 'inherits';

import BpmnModeling from 'bpmn-js/lib/features/modeling/Modeling';

import SwapParticipantBandHandler from './cmd/SwapParticipantBandHandler';
import CreateParticipantBandHandler from './cmd/CreateParticipantBandHandler';
import ToggleMessageVisibilityHandler from './cmd/ToggleMessageVisibilityHandler';
import AddMessageHandler from './cmd/AddMessageHandler';
import UpdateMessageLabelHandler from '../label-editing/cmd/UpdateMessageLabelHandler';
import ParticipantMultiplicityHandler from './cmd/ParticipantMultiplicityHandler';
import ChangeParticipantBandHandler from './cmd/ChangeParticipantBandHandler';
import SwapInitiatingParticipantHandler from './cmd/SwapInitiatingParticipantHandler';
import ChoreoAppendShapeHandler from './cmd/ChoreoAppendShapeHandler';
import LinkCallChoreoHandler from './cmd/LinkCallChoreoHandler';
import LinkCallChoreoParticipantHandler from './cmd/LinkCallChoreoParticipantHandler';
import ChoreoParticipantHandler from './cmd/ChoreoParticipantHandler.js';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Component that manages choreography specific modeling moves that attach to the
 * command stack.
 */
export default function ChoreoModeling(injector, commandStack) {
  injector.invoke(BpmnModeling, this);
  this._commandStack = commandStack;
}

inherits(ChoreoModeling, BpmnModeling);

ChoreoModeling.$inject = [
  'injector',
  'commandStack'
];

ChoreoModeling.prototype.getHandlers = function() {
  var handlers = BpmnModeling.prototype.getHandlers.call(this);

  handlers['band.swap'] = SwapParticipantBandHandler;
  handlers['band.create'] = CreateParticipantBandHandler;
  handlers['band.delete'] = CreateParticipantBandHandler; // TODO split this handler in two
  handlers['band.change'] = ChangeParticipantBandHandler;
  handlers['band.swapInitiatingParticipant'] = SwapInitiatingParticipantHandler;
  handlers['message.toggle'] = ToggleMessageVisibilityHandler;
  handlers['message.add'] = AddMessageHandler;
  handlers['element.updateLabel'] = UpdateMessageLabelHandler;
  handlers['participant.toggleMultiplicity'] = ParticipantMultiplicityHandler;
  handlers['shape.append'] = ChoreoAppendShapeHandler;
  handlers['link.callChoreo'] = LinkCallChoreoHandler;
  handlers['link.callChoreoParticipant'] = LinkCallChoreoParticipantHandler;
  handlers['participant.create'] = ChoreoParticipantHandler;
  return handlers;
};

ChoreoModeling.prototype.swapParticipantBand = function(activityShape, bandShape, upwards) {
  this._commandStack.execute('band.swap', {
    activityShape: activityShape,
    bandShape: bandShape,
    upwards: upwards
  });
};

ChoreoModeling.prototype.createParticipantBand = function(activityShape, participant) {
  this._commandStack.execute('band.create', {
    delete: false,
    activityShape: activityShape,
    participant: participant
  });
};

ChoreoModeling.prototype.deleteParticipantBand = function(activityShape, participant) {
  this._commandStack.execute('band.delete', {
    delete: true,
    activityShape: activityShape,
    participant: participant
  });
};

ChoreoModeling.prototype.toggleParticipantMultiplicity = function(bandShape) {
  this._commandStack.execute('participant.toggleMultiplicity', {
    bandShape: bandShape
  });
};

ChoreoModeling.prototype.toggleMessageVisibility = function(element) {
  this._commandStack.execute('message.toggle', {
    element: element
  });
};

ChoreoModeling.prototype.addMessage = function(bandShape) {
  this._commandStack.execute('message.add', {
    bandShape: bandShape
  });
};

ChoreoModeling.prototype.changeParticipant = function(bandShape, participant) {
  this._commandStack.execute('band.change', {
    bandShape: bandShape,
    newParticipant: participant
  });
};

ChoreoModeling.prototype.swapInitiatingParticipant = function(bandShape) {
  this._commandStack.execute('band.swapInitiatingParticipant', {
    bandShape: bandShape,
  });
};

ChoreoModeling.prototype.linkCallChoreo = function(element, newRef) {
  this._commandStack.execute('link.callChoreo', {
    element: element,
    newRef: newRef
  });
};

ChoreoModeling.prototype.unlinkCallChoreo = function(element) {
  this._commandStack.execute('link.callChoreo', {
    element: element
  });
};

ChoreoModeling.prototype.linkCallChoreoParticipant = function(element, outerParticipant, innerParticipant) {
  this._commandStack.execute('link.callChoreoParticipant', {
    element: element,
    outerParticipant: outerParticipant,
    innerParticipant: innerParticipant
  });
};

ChoreoModeling.prototype.unlinkCallChoreoParticipant = function(element, outerParticipant) {
  this._commandStack.execute('link.callChoreoParticipant', {
    element: element,
    outerParticipant: outerParticipant,
  });
};

ChoreoModeling.prototype.unlinkCallChoreoParticipants = function(element) {
  const participantAssociationsCopy = element.participantAssociations ? element.participantAssociations.slice() : [];
  participantAssociationsCopy.forEach(pa =>
    this._commandStack.execute('link.callChoreoParticipant', {
      element: element,
      outerParticipant: pa.outerParticipantRef
    }));
};

/**
 * Create, connect, and returns a participant business object via a command call.
 * @returns {*} Participant Business Object
 */
ChoreoModeling.prototype.createParticipant = function() {
  const participantContext = {};
  this._commandStack.execute('participant.create', participantContext);
  return participantContext.created;
};

/**
 * This function overwrites the one from diagram-js. Crucially we need to filter out all the participants
 * or else they are moved twice, as they are nested in the activity and then moved again separately.
 * Info: Alternatively this issue could be fixed by overwriting space tool handler, but we decided not to
 * do this as it would require an additional file.
 * Additionally, the spaceTool is only ever called via the modeling object.
 * @param movingShapes
 * @param resizingShapes
 * @param delta
 * @param direction
 * @param start
 */
ChoreoModeling.prototype.createSpace = function(movingShapes, resizingShapes, delta, direction, start) {
  if (direction === 'n' || direction === 's') {
    movingShapes = movingShapes.filter(s => !is(s, 'bpmn:Participant'));
  }
  var context = {
    movingShapes: movingShapes,
    resizingShapes: resizingShapes,
    delta: delta,
    direction: direction,
    start: start
  };

  this._commandStack.execute('spaceTool', context);
};
