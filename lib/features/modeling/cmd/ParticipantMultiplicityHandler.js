/**
 * Command handler that fires on
 */
export default function ParticipantMultiplicityHandler(eventBus, bpmnFactory) {
  this._eventBus = eventBus;
  this._bpmnFactory = bpmnFactory;
}

ParticipantMultiplicityHandler.$inject = [
  'eventBus',
  'bpmnFactory'
];

ParticipantMultiplicityHandler.prototype.execute = function(context) {
  if (context.hasMultiplicity) {
    delete context.participant.businessObject.participantMultiplicity;
  } else {
    const multiplicity = this._bpmnFactory.create('bpmn:ParticipantMultiplicity',
      { parent: context.participant, maximum: 2 });
    context.participant.businessObject.participantMultiplicity = multiplicity;
  }
  this._eventBus.fire('element.changed', {
    element: context.participant
  });
};

ParticipantMultiplicityHandler.prototype.revert = function(context) {
  context.activityShape.businessObject.loopType = context.oldLoopType;
  this._eventBus.fire('element.changed', {
    element: context.activityShape
  });
};