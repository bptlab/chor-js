import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';

/**
 *
 * @param popupMenu
 * @param modeling
 * @param moddle {Moddle}
 * @constructor
 */
export default function ParticipantLinkingPopupProvider(popupMenu, modeling, moddle) {
  PopupMenuProvider.call(this, popupMenu);
  this._modeling = modeling;
  this._moddle = moddle;
}

inherits(ParticipantLinkingPopupProvider, PopupMenuProvider);




ParticipantLinkingPopupProvider.prototype.getEntries = function(element) {
  const entries = [];
  const callChoreoBo = element.activityShape.businessObject;
  const participants = callChoreoBo.calledChoreographyRef.participants;
  let outerParticipant = element.businessObject;
  let currentInnerParticipant;

  if (callChoreoBo.participantAssociations) {
    const participantAssociation = callChoreoBo.participantAssociations.find(
      pa => pa.outerParticipantRef === element.businessObject);

    if (participantAssociation) {
      currentInnerParticipant = participantAssociation.innerParticipantRef;
    }
  }

  participants.forEach(p => entries.push({
    label: p.name,
    id: p.id,
    active: p === currentInnerParticipant,
    action: () => this._modeling.linkCallChoreoParticipant(callChoreoBo, outerParticipant, p)
  }));

  return entries;
};

ParticipantLinkingPopupProvider.prototype.register = function() {
  this._popupMenu.registerProvider('participant-linking-provider', this);
};