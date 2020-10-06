import { createParticipant } from '../../../util/BandUtil';

/**
 * A command that creates and connects a new participant business object. Basically wraps
 a call to #createParticipant from BandUtil due to historic reasons.
 * @param {Injector} injector
 * @constructor
 */
export default function ChoreoParticipantHandler(injector) {
  this._injector = injector;
}
ChoreoParticipantHandler.$inject = [
  'injector',
];

ChoreoParticipantHandler.prototype.execute = function(context) {
  const participant = createParticipant(this._injector);
  context.created = participant;
  return participant;
};

ChoreoParticipantHandler.prototype.revert = function(context) {
  const participant = context.created;
  const choreo = this._injector.get('canvas').getRootElement();
  if (choreo.businessObject.participants) {
    const index = choreo.businessObject.participants.findIndex(p => p === participant);
    if (index >= 0) {
      choreo.businessObject.participants.splice(index, 1);
    }
  }
};
