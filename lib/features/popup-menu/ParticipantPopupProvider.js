import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';

/**
 * Popup on participant bands that provides functionality to change the participant
 * associated to a band and the multiplicity of that participant.
 */
export default function ParticipantPopupProvider(popupMenu, modeling, canvas) {
  PopupMenuProvider.call(this, popupMenu);
  this._modeling = modeling;
  this._canvas = canvas;
}

inherits(ParticipantPopupProvider, PopupMenuProvider);

ParticipantPopupProvider.$inject = [
  'popupMenu',
  'modeling',
  'canvas'
];

ParticipantPopupProvider.prototype.getEntries = function(element) {
  let entries = [];

  let choreo = this._canvas.getRootElement();
  let participants = choreo.businessObject.get('participants');

  // one button for each participant that is not already part of the activity
  participants.forEach(participant => {
    if (element.parent.businessObject.get('participantRef').indexOf(participant) === -1) {
      entries.push({
        label: participant.name,
        id: participant.id,
        action: () => this._modeling.changeParticipant(element, participant)
      });
    }
  });

  // one button for creating a new participant
  entries.push({
    label: '',
    id: 'new_participant',
    className: 'bpmn-icon-sub-process-marker',
    action: () => this._modeling.changeParticipant(element)
  });

  return entries;
};

ParticipantPopupProvider.prototype.register = function() {
  this._popupMenu.registerProvider('participant-provider', this);
};