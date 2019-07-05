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
import ChoreoPasteHandler from './cmd/ChoreoPasteHandler';
import ChoreoAppendShapeHandler from './cmd/ChoreoAppendShapeHandler';
import LinkCallChoreoHandler from './cmd/LinkCallChoreoHandler';
import LinkCallChoreoParticipantHandler from './cmd/LinkCallChoreoParticipantHandler';

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
  handlers['band.delete'] = CreateParticipantBandHandler; //TODO split this handler in two
  handlers['band.change'] = ChangeParticipantBandHandler;
  handlers['band.swapInitiatingParticipant'] = SwapInitiatingParticipantHandler;
  handlers['message.toggle'] = ToggleMessageVisibilityHandler;
  handlers['message.add'] = AddMessageHandler;
  handlers['element.updateLabel'] = UpdateMessageLabelHandler;
  handlers['participant.toggleMultiplicity'] = ParticipantMultiplicityHandler;
  handlers['elements.paste'] = ChoreoPasteHandler;
  handlers['shape.append'] = ChoreoAppendShapeHandler;
  handlers['link.callChoreo'] = LinkCallChoreoHandler;
  handlers['link.callChoreoParticipant'] = LinkCallChoreoParticipantHandler;
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

ChoreoModeling.prototype.linkCallChoreoParticipant = function(callChoreoBO, outerParticipant, innerParticipant) {
  this._commandStack.execute('link.callChoreoParticipant', {
    element: callChoreoBO, outerParticipant: outerParticipant, innerParticipant: innerParticipant
  });
};