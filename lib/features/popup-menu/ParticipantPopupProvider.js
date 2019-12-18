import inherits from 'inherits';
import PopupMenuProvider from 'diagram-js/lib/features/popup-menu/PopupMenuProvider';
import { hasBandMarker } from '../../util/BandUtil';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Popup on participant bands that provides functionality to change the participant
 * associated to a band and the multiplicity of that participant.
 * @constructor
 * @param {Injector} injector
 * @param {PopupMenu} popupMenu
 * @param {ChoreoModeling} modeling
 * @param {Canvas} canvas
 */
export default function ParticipantPopupProvider(injector, popupMenu, modeling, canvas) {
  injector.invoke(PopupMenuProvider, this);
  this._popupMenu = popupMenu;
  this._modeling = modeling;
  this._canvas = canvas;
}

inherits(ParticipantPopupProvider, PopupMenuProvider);

ParticipantPopupProvider.$inject = [
  'injector',
  'popupMenu',
  'modeling',
  'canvas'
];

ParticipantPopupProvider.prototype.getHeaderEntries = function(element) {
  if (is(element, 'bpmn:Participant')) {
    const isMultiple = hasBandMarker(element.businessObject);
    let self = this;

    return [
      {
        id: 'toggle-parallel-mi',
        className: 'bpmn-icon-parallel-mi-marker',
        title: 'Multiple participants',
        active: isMultiple,
        action: () => self._modeling.toggleParticipantMultiplicity(element)
      }
    ];
  }
};

ParticipantPopupProvider.prototype.getEntries = function(element) {
  let entries = [];

  let choreo = this._canvas.getRootElement();
  let participants = choreo.businessObject.get('participants');

  function canSelectParticipant(participant) {
    let participantRef;
    if (is(element, 'bpmn:Participant')) {
      participantRef = element.parent.businessObject.get('participantRef');
    } else if (is(element, 'bpmn:ChoreographyActivity')) {
      participantRef = element.businessObject.get('participantRef');
    }
    return participantRef.indexOf(participant) === -1;
  }

  // depending on whether this menu is attached to a participant band or
  // a choreo activity it might trigger different actions
  let action;
  if (is(element, 'bpmn:Participant')) {
    action = this._modeling.changeParticipant;
  } else if (is(element, 'bpmn:ChoreographyActivity')) {
    action = this._modeling.createParticipantBand;
  }

  // one button for each participant that is not already part of the element
  participants.filter(canSelectParticipant).forEach(participant => {
    entries.push({
      label: participant.name,
      id: participant.id,
      action: () => action.call(this._modeling, element, participant)
    });
  });

  // one button for creating a new participant
  entries.push({
    label: '[New Participant]',
    id: 'new_participant',
    className: 'bpmn-icon-sub-process-marker',
    action: () => action.call(this._modeling, element)
  });

  return entries;
};

ParticipantPopupProvider.prototype.register = function() {
  this._popupMenu.registerProvider('participant-provider', this);
};