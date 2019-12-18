import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';

/**
 * Provides a popup menu for linking participants between choreographies,
 * i.e., when using call choreographies.
 *
 * @constructor
 * @param {Injector} injector
 * @param {PopupMenu} popupMenu
 * @param {ChoreoModeling} modeling
 * @param {Moddle} moddle {Moddle}
 */
export default function ParticipantLinkingPopupProvider(injector, popupMenu, modeling, moddle) {
  injector.invoke(PopupMenuProvider, this);
  this._popupMenu = popupMenu;
  this._modeling = modeling;
  this._moddle = moddle;
}

inherits(ParticipantLinkingPopupProvider, PopupMenuProvider);

ParticipantLinkingPopupProvider.$inject = [
  'injector',
  'popupMenu',
  'modeling',
  'moddle'
];


ParticipantLinkingPopupProvider.prototype.getEntries = function(element) {
  const entries = [];
  const callChoreoBo = element.activityShape.businessObject;
  const participants = callChoreoBo.calledChoreographyRef.participants || [];
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

  if (entries.length == 0) {
    entries.push({
      id: 'select-none',
      className: 'italic',
      label: 'no targets found'
    });
  }

  return entries;
};

ParticipantLinkingPopupProvider.prototype.register = function() {
  this._popupMenu.registerProvider('participant-linking-provider', this);
};