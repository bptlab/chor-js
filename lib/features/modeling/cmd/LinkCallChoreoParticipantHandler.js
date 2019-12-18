/**
 *
 * @param {Moddle} moddle
 * @constructor
 */
export default function LinkCallChoreoParticipantHandler(moddle) {
  this._moddle = moddle;
}

LinkCallChoreoParticipantHandler.$inject = [
  'moddle'
];

/**
 * Links the outer Participant of a Call Choreo to the inner Particiant of called Chore by creating a participant
 * association. If the inner Participant is undefined it works as an unlink.
 * @param element
 * @param outerParticipant
 * @param innerParticipant
 * @returns {*[]}
 */
LinkCallChoreoParticipantHandler.prototype.link = function(element, outerParticipant, innerParticipant) {
  const oldParticipantAssociation = element.participantAssociations.find(
    pa => pa.outerParticipantRef === outerParticipant);

  if (oldParticipantAssociation) {
    // We remove the old participant association
    element.participantAssociations = element.participantAssociations.filter(
      pa => pa !== oldParticipantAssociation);

    if (oldParticipantAssociation.innerParticipantRef === innerParticipant) {
      // In case the current innerParticipant is set again, we interpret it as a toggling and remove it.
      return [element];
    }
  }
  if (innerParticipant) {
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
    pa => pa.outerParticipantRef === context.outerParticipant);
  if (participantAssociation) {
    context.oldInnerParticipant = participantAssociation.innerParticipantRef;
  }
};

LinkCallChoreoParticipantHandler.prototype.execute = function(context) {
  return this.link(context.element, context.outerParticipant, context.innerParticipant);
};

LinkCallChoreoParticipantHandler.prototype.revert = function(context) {
  return this.link(context.element, context.outerParticipant, context.oldInnerParticipant);
};