import { getBandHeight, createParticipant, updateBands } from '../../../util/BandUtil';

export default function ChangeParticipantBandHandler(injector, commandStack, elementRegistry, eventBus) {
  this._injector = injector;
  this._commandStack = commandStack;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
}

ChangeParticipantBandHandler.$inject = [
  'injector',
  'commandStack',
  'elementRegistry',
  'eventBus'
];

ChangeParticipantBandHandler.prototype.changeParticipant = function(context, oldParticipant, newParticipant) {
  let bandShape = context.bandShape;
  let diBand = bandShape.diBand;
  let activityShape = bandShape.activityShape;
  let activity = activityShape.businessObject;

  // relink semantic objects
  bandShape.businessObject = newParticipant;
  diBand.bpmnElement = newParticipant;

  // update activity properties
  if (activity.get('initiatingParticipantRef') === oldParticipant) {
    activity.set('initiatingParticipantRef', newParticipant);
  }

  if (activity.messageFlowRef) {
    activity.messageFlowRef.forEach(messageFlow => {
      if (messageFlow.get('sourceRef') === oldParticipant) {
        messageFlow.set('sourceRef', newParticipant);
      }
      if (messageFlow.get('targetRef') === oldParticipant) {
        messageFlow.set('targetRef', newParticipant);
      }
    });
  }

  // change the actual participant ref
  activity.get('participantRef').splice(context.index, 1, newParticipant);

  // update band heights if necessary
  if (getBandHeight(oldParticipant) != getBandHeight(newParticipant)) {
    updateBands(activityShape, this._eventBus);
  }

  // redraw the band
  this._eventBus.fire('element.changed', {
    element: bandShape
  });
};

ChangeParticipantBandHandler.prototype.preExecute = function(context) {
  let bandShape = context.bandShape;
  let activity = bandShape.activityShape.businessObject;

  context.oldParticipant = bandShape.businessObject;
  context.index = activity.get('participantRef').indexOf(context.oldParticipant);

  if (!context.newParticipant) {
    context.newParticipant = createParticipant(this._injector);
    context.newParticipant.di = bandShape.activityShape.diBand;
  }
}

ChangeParticipantBandHandler.prototype.execute = function(context) {
  this.changeParticipant(context, context.oldParticipant, context.newParticipant);
};

ChangeParticipantBandHandler.prototype.revert = function(context) {
  this.changeParticipant(context, context.newParticipant, context.oldParticipant);
};