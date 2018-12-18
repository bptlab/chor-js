import { is } from 'bpmn-js/lib/util/ModelUtil';
import { updateBands, hasBandMarker } from '../../../util/BandUtil';

/**
 * Command handler that fires on participant.toggleMultiplicity. Changes the multiplicity of
 * a participant. Redraw bands and activities if necessary.
 */
export default function ParticipantMultiplicityHandler(injector, eventBus, bpmnFactory, elementRegistry) {
  this._injector = injector;
  this._eventBus = eventBus;
  this._bpmnFactory = bpmnFactory;
  this._elementRegistry = elementRegistry;
}

ParticipantMultiplicityHandler.$inject = [
  'injector',
  'eventBus',
  'bpmnFactory',
  'elementRegistry'
];

/**
 * Returns all the activity shapes that have a band of the given participant.
 */
ParticipantMultiplicityHandler.prototype.getActivityShapes = function(participant) {
  return this._elementRegistry.filter(
    element => is(element, 'bpmn:ChoreographyActivity') &&
      element.bandShapes.some(bandShape => bandShape.businessObject === participant)
  );
};

ParticipantMultiplicityHandler.prototype.toggle = function(context) {
  let bandShape = context.bandShape;
  let participant = bandShape.businessObject;

  // toggle multiplicity
  if (hasBandMarker(participant)) {
    delete participant.participantMultiplicity;
  } else {
    let multiplicity = this._bpmnFactory.create('bpmn:ParticipantMultiplicity', { maximum: 2 });
    multiplicity.$parent = participant;
    participant.participantMultiplicity = multiplicity;
  }

  return this.getActivityShapes(participant);
};

ParticipantMultiplicityHandler.prototype.postExecute = function(context) {
  let bandShape = context.bandShape;
  let participant = bandShape.businessObject;

  // resize all affected bands
  this.getActivityShapes(participant).forEach(activityShape => updateBands(this._injector, activityShape));
};

ParticipantMultiplicityHandler.prototype.execute = function(context) {
  return this.toggle(context);
};

ParticipantMultiplicityHandler.prototype.revert = function(context) {
  return this.toggle(context);
};