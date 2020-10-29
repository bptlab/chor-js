/**
 * A command that creates and connects a new participant business object.
 *
 * @param {Injector} injector
 * @constructor
 */
export default function ChoreoParticipantHandler(canvas, bpmnFactory) {
  this._canvas = canvas;
  this._bpmnFactory = bpmnFactory;
}

ChoreoParticipantHandler.$inject = [
  'canvas',
  'bpmnFactory'
];

ChoreoParticipantHandler.prototype.execute = function(context) {
  let participant = this._bpmnFactory.create('bpmn:Participant');

  let choreo = this._canvas.getRootElement();
  if (choreo.businessObject.participants) {
    choreo.businessObject.participants.push(participant);
  } else {
    choreo.businessObject.participants = [ participant ];
  }
  participant.name = 'New Participant ' + countNewParticipants(choreo.businessObject.participants);
  participant.$parent = choreo;
  context.created = participant;
};

ChoreoParticipantHandler.prototype.revert = function(context) {
  const participant = context.created;
  const choreo = this._canvas.getRootElement();
  if (choreo.businessObject.participants) {
    const index = choreo.businessObject.participants.findIndex(p => p === participant);
    if (index >= 0) {
      choreo.businessObject.participants.splice(index, 1);
    }
  }
};

function countNewParticipants(participants) {
  if (participants) {
    return participants.filter(p => p.name).filter(p => p.name.indexOf('New Participant') === 0).length + 1;
  }
  return 1;
}
