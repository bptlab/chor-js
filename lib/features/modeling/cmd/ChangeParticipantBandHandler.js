import { getBandHeight, updateBands } from '../../../util/BandUtil';

/**
 * A handler that fires on `band.change` and changes the participant associated to a band.
 * @constructor
 * @param {Injector} injector
 * @param {Modeling} modeling
 */
export default function ChangeParticipantBandHandler(injector, modeling) {
  this._injector = injector;
  this._modeling = modeling;
}

ChangeParticipantBandHandler.$inject = [
  'injector',
  'modeling',
  'commandStack'
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

  return [bandShape, activityShape];
};

ChangeParticipantBandHandler.prototype.relinkCallChoreoParticipants = function(oldParticipant, newParticipant, activity) {
  if (activity.participantAssociations) {
    const association = activity.participantAssociations.find(pa => pa.outerParticipantRef === oldParticipant);
    if (association) {
      const innerParticipant = association.innerParticipantRef;
      this._modeling.unlinkCallChoreoParticipant(activity, oldParticipant);
      this._modeling.linkCallChoreoParticipant(activity, newParticipant, innerParticipant);
    }
  }
};

ChangeParticipantBandHandler.prototype.preExecute = function(context) {
  let bandShape = context.bandShape;
  let activity = bandShape.activityShape.businessObject;

  context.oldParticipant = bandShape.businessObject;
  context.index = activity.get('participantRef').indexOf(context.oldParticipant);

  if (!context.newParticipant) {
    context.newParticipant = this._modeling.createParticipant();
    context.newParticipant.di = bandShape.diBand;
  }
  this.relinkCallChoreoParticipants(context.oldParticipant, context.newParticipant, activity);

};

ChangeParticipantBandHandler.prototype.postExecute = function(context) {
  let bandShape = context.bandShape;

  // update band heights if necessary
  if (getBandHeight(context.oldParticipant) != getBandHeight(context.newParticipant)) {
    updateBands(this._injector, bandShape.activityShape);
  }
};

ChangeParticipantBandHandler.prototype.execute = function(context) {
  return this.changeParticipant(context, context.oldParticipant, context.newParticipant);
};

ChangeParticipantBandHandler.prototype.revert = function(context) {
  return this.changeParticipant(context, context.newParticipant, context.oldParticipant);
};
