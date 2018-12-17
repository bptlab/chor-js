/**
 * Command handler that fires on `activity.changeLoopType` and
 * changes the loop type of an activity.
 */
export default function MakeInitiatingParticipantBandHandler(eventBus) {
  this._eventBus = eventBus;
}

MakeInitiatingParticipantBandHandler.$inject = [
  'eventBus'
];

MakeInitiatingParticipantBandHandler.prototype._updateBands = function(context) {
  this._eventBus.fire('element.changed', {
    element: context.nonInitParticipant
  });
  this._eventBus.fire('element.changed', {
    element: context.initParticipant
  });
  this._eventBus.fire('element.changed', {
    element: context.choreography
  });
};

MakeInitiatingParticipantBandHandler.prototype.execute = function(context) {
  context.choreography.businessObject.initiatingParticipantRef = context.nonInitParticipant.businessObject;
  context.nonInitParticipant.diBand.participantBandKind = context.nonInitBandKind.split('_')[0] + '_initiating';
  context.initParticipant.diBand.participantBandKind = context.initBandKind.split('_')[0] + '_non_initiating';
  this._updateBands(context);

};

MakeInitiatingParticipantBandHandler.prototype.revert = function(context) {
  context.choreography.businessObject.initiatingParticipantRef = context.initParticipant.businessObject;
  context.nonInitParticipant.diBand.participantBandKind = context.nonInitBandKind.split('_')[0] + '_non_initiating';
  context.initParticipant.diBand.participantBandKind = context.initBandKind.split('_')[0] + '_initiating';
  this._updateBands(context);
};