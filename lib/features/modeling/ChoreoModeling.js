import inherits from 'inherits';

import BpmnModeling from 'bpmn-js/lib/features/modeling/Modeling';

import MoveParticipantBandHandler from './cmd/MoveParticipantBandHandler';
import CreateParticipantBandHandler from './cmd/CreateParticipantBandHandler';
import ChangeLoopTypeMarkerHandler from './cmd/ChangeLoopTypeMarkerHandler';
import ToggleMessageVisibilityHandler from './cmd/ToggleMessageVisibilityHandler';
import AddMessageHandler from './cmd/AddMessageHandler';
import ParticipantMultiplicityHandler from './cmd/ParticipantMultiplicityHandler';

import { is } from 'bpmn-js/lib/util/ModelUtil';
import UpdateMessageLabelHandler from '../label-editing/cmd/UpdateMessageLabelHandler';
import { hasBandMarker } from '../../util/BandUtil';

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

  handlers['band.move'] = MoveParticipantBandHandler;
  handlers['band.create'] = CreateParticipantBandHandler;
  handlers['band.delete'] = CreateParticipantBandHandler;
  handlers['activity.changeLoopType'] = ChangeLoopTypeMarkerHandler;
  handlers['message.toggle'] = ToggleMessageVisibilityHandler;
  handlers['message.add'] = AddMessageHandler;
  handlers['element.updateLabel'] = UpdateMessageLabelHandler;
  handlers['participant.toggleMultiplicity'] = ParticipantMultiplicityHandler;

  return handlers;
};

ChoreoModeling.prototype.moveParticipantBand = function(activityShape, bandShape, upwards) {
  this._commandStack.execute('band.move', {
    activityShape: activityShape,
    bandShape: bandShape,
    upwards: upwards
  });
};

ChoreoModeling.prototype.createParticipantBand = function(activityShape) {
  this._commandStack.execute('band.create', {
    delete: false,
    activityShape: activityShape
  });
};

ChoreoModeling.prototype.deleteParticipantBand = function(activityShape, bandShape) {
  this._commandStack.execute('band.delete', {
    delete: true,
    activityShape: activityShape,
    index: activityShape.bandShapes.indexOf(bandShape)
  });
};

ChoreoModeling.prototype.changeLoopTypeMarker = function(activityShape, markerType) {
  this._commandStack.execute('activity.changeLoopType', {
    activityShape: activityShape,
    oldLoopType: activityShape.businessObject.loopType,
    newLoopType: markerType
  });
};

ChoreoModeling.prototype.toggleParticipantMultiplicity = function(participant) {
  this._commandStack.execute('participant.toggleMultiplicity', {
    participant: participant,
    hasMultiplicity: hasBandMarker(participant.businessObject)
  });
};

ChoreoModeling.prototype.toggleMessageVisibility = function(shape) {
  if (is(shape, 'bpmn:Message')) {
    this._commandStack.execute('message.toggle', {
      bandShape: shape.parent
    });
  } else if (is(shape, 'bpmn:Participant')) {
    this._commandStack.execute('message.toggle', {
      bandShape: shape
    });
  }
};

ChoreoModeling.prototype.addMessage = function(bandShape) {
  this._commandStack.execute('message.add', {
    bandShape: bandShape
  });
};