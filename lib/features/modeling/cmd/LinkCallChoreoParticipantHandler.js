export default function LinkCallChoreoParticipantHandler(moddle) {
  this._moddle = moddle;
}

LinkCallChoreoParticipantHandler.prototype.link = function(element, outerParticipant, innerParticipant) {
  const oldParticipantAssociations = element.participantAssociations.find(
    pa => pa.outerParticipantRef === outerParticipant);
  if (oldParticipantAssociations) {
    element.participantAssociations = element.participantAssociations.filter(
      pa => pa !== oldParticipantAssociations);

    // In case the current innerParticiapant is set again, we toggle and remove it.
    if(oldParticipantAssociations.innerParticipantRef === innerParticipant){
      return [element]
    }
  }
  if (innerParticipant !== undefined) {
    const participantAssociation = this._moddle.create('bpmn:ParticipantAssociation', {
      outerParticipantRef: outerParticipant,
      innerParticipantRef: innerParticipant
    });

    element.participantAssociations.push(participantAssociation);
  }

  return [element];
};

LinkCallChoreoParticipantHandler.prototype.preExecute = function(context) {
  context.element.participantAssociations = context.element.participantAssociations || [];

  const participantAssociation = context.element.participantAssociations.find(
    pa => pa.innerParticipantRef === context.innerParticipant);
  if (participantAssociation) {
    context.oldInnerParticipant = participantAssociation.innerParticipantRef;
  }
};

LinkCallChoreoParticipantHandler.prototype.execute = function(context) {
  return this.link(context.element, context.outerParticipant, context.innerParticipant);
};

LinkCallChoreoParticipantHandler.prototype.revert = function(context) {
  this.link(context.element, context.outerParticipant, context.oldInnerParticipant);
};