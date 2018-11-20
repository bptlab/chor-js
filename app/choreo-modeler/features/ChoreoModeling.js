import inherits from 'inherits';

import BpmnModeling from 'bpmn-js/lib/features/modeling/Modeling';

import MoveParticipantBandHandler from './cmd/MoveParticipantBandHandler';

/**
 * Component that manages choreography specific modeling moves that attach to the
 * command stack.
 */
export default function ChoreoModeling(injector, commandStack) {
  injector.invoke(BpmnModeling, this);
  this._commandStack = commandStack;
}

inherits(ChoreoModeling, BpmnModeling);

ChoreoModeling.$inject = [
  'injector',
  'commandStack'
];

ChoreoModeling.prototype.getHandlers = function() {
  var handlers = BpmnModeling.prototype.getHandlers.call(this);

  handlers['band.move'] = MoveParticipantBandHandler;

  return handlers;
};

ChoreoModeling.prototype.moveParticipantBand = function(activityShape, bandShape, upwards) {
  this._commandStack.execute('band.move', {
    activityShape: activityShape,
    bandShape: bandShape,
    upwards: upwards
  });
}