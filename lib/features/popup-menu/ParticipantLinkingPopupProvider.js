import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';


/**
 *
 */
export default function ParticipantLinkingPopupProvider(popupMenu, modeling, canvas) {
  PopupMenuProvider.call(this, popupMenu);
  this._modeling = modeling;
  this._canvas = canvas;
}

inherits(ParticipantLinkingPopupProvider, PopupMenuProvider);



ParticipantLinkingPopupProvider.prototype.getHeaderEntries = function(element) {
  return [];
};

ParticipantLinkingPopupProvider.prototype.getEntries = function(element) {
  const entries = [];
  let participants = element.activityShape.businessObject.calledChoreographyRef.participants;
  participants.forEach(p => entries.push({label: p.name, id: p.id, action: () => console.log(p)}));
  entries.push({
    label: '[New Participant]',
    id: 'new_participant',
    className: 'bpmn-icon-sub-process-marker',
    action: () => action.call(this._modeling, element)
  });

  return entries;
};

ParticipantLinkingPopupProvider.prototype.register = function() {
  this._popupMenu.registerProvider('participant-linking-provider', this);
};