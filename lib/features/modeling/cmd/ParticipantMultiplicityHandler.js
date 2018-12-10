/**
 * Command handler that fires on participant.toggleMultiplicity. Changes the multiplicity of
 * a participant. Redraw bands and activities if necessary.
 */
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { updateBands } from '../../../util/BandUtil';

export default function ParticipantMultiplicityHandler(eventBus, bpmnFactory, elementRegistry) {
  this._eventBus = eventBus;
  this._bpmnFactory = bpmnFactory;
  this._elementRegistry = elementRegistry;
}

ParticipantMultiplicityHandler.prototype.updateAllBands = function(participant) {
  let activities = this._elementRegistry.filter(
    element => is(element, 'bpmn:ChoreographyActivity') &&
      element.bandShapes.some(band => band.businessObject.id === participant.businessObject.id)
  );
  activities.forEach(activity => updateBands(activity, this._eventBus));
};

ParticipantMultiplicityHandler.$inject = [
  'eventBus',
  'bpmnFactory',
  'elementRegistry'
];

ParticipantMultiplicityHandler.prototype.execute = function(context) {
  if (context.hasMultiplicity) {
    delete context.participant.businessObject.participantMultiplicity;
  } else {
    const multiplicity = this._bpmnFactory.create('bpmn:ParticipantMultiplicity', { maximum: 2 });
    multiplicity.$parent = context.participant.businessObject;
    context.participant.businessObject.participantMultiplicity = multiplicity;
  }
  this.updateAllBands(context.participant);
};

ParticipantMultiplicityHandler.prototype.revert = function(context) {
  context.hasMultiplicity = !context.hasMultiplicity;
  this.execute(context);
};