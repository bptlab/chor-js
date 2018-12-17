import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Command to change the initiating participant band of a choreography. Fires on 'band.makeInitiating'.
 */
export default function MakeInitiatingParticipantBandHandler(eventBus) {
  this._eventBus = eventBus;
}

MakeInitiatingParticipantBandHandler.$inject = [
  'eventBus'
];

MakeInitiatingParticipantBandHandler.prototype._redraw = function(context) {
  this._eventBus.fire('element.changed', {
    element: context.nonInitBand
  });
  this._eventBus.fire('element.changed', {
    element: context.initBand
  });
  this._eventBus.fire('element.changed', {
    element: context.choreography
  });
  if (is(context.choreography, 'bpmn:ChoreographyTask')) {
    this._eventBus.fire('element.changed', {
      element: context.nonInitBand.attachedMessageShape
    });
    this._eventBus.fire('element.changed', {
      element: context.initBand.attachedMessageShape
    });
  }
};

MakeInitiatingParticipantBandHandler.prototype.execute = function(context) {
  const choreography = context.choreography;
  const initBand = context.initBand;
  const nonInitBand = context.nonInitBand;

  choreography.businessObject.initiatingParticipantRef = context.nonInitBand.businessObject;
  nonInitBand.diBand.participantBandKind = context.nonInitBandKind.split('_')[0] + '_initiating';
  initBand.diBand.participantBandKind = context.initBandKind.split('_')[0] + '_non_initiating';
  this._redraw(context);

};

MakeInitiatingParticipantBandHandler.prototype.revert = function(context) {
  const choreography = context.choreography;
  const initBand = context.initBand;
  const nonInitBand = context.nonInitBand;

  choreography.businessObject.initiatingParticipantRef = context.initBand.businessObject;
  nonInitBand.diBand.participantBandKind = context.nonInitBand.split('_')[0] + '_non_initiating';
  initBand.diBand.participantBandKind = context.initBandKind.split('_')[0] + '_initiating';
  this._redraw(context);
};