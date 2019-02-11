import { assign } from 'min-dash';
import { getAttachedMessageShape } from '../../../util/MessageUtil';

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
    element: context.nonInitBandShape
  });
  this._eventBus.fire('element.changed', {
    element: context.initBandShape
  });
  if (getAttachedMessageShape(context.nonInitBandShape)) {
    this._eventBus.fire('element.changed', {
      element: getAttachedMessageShape(context.nonInitBandShape)
    });
  }
  if (getAttachedMessageShape(context.initBandShape)) {
    this._eventBus.fire('element.changed', {
      element: getAttachedMessageShape(context.initBandShape)
    });
  }
};

MakeInitiatingParticipantBandHandler.prototype.preExecute = function(context) {
  const bandShape = context.nonInitBandShape;
  const initParticipantBand = bandShape.parent.children.find(
    x => x.businessObject === bandShape.parent.businessObject.initiatingParticipantRef);
  assign(context, {
    activityShape: bandShape.parent,
    initBandShape: initParticipantBand,
    nonInitBandKind: bandShape.diBand.participantBandKind,
    initBandKind: initParticipantBand.diBand.participantBandKind
  });
};

MakeInitiatingParticipantBandHandler.prototype.execute = function(context) {
  const activityShape = context.activityShape;
  const initBandShape = context.initBandShape;
  const nonInitBandShape = context.nonInitBandShape;

  activityShape.businessObject.initiatingParticipantRef = context.nonInitBandShape.businessObject;
  nonInitBandShape.diBand.participantBandKind = context.nonInitBandKind.split('_')[0] + '_initiating';
  initBandShape.diBand.participantBandKind = context.initBandKind.split('_')[0] + '_non_initiating';
  this._redraw(context);

};

MakeInitiatingParticipantBandHandler.prototype.revert = function(context) {
  const activityShape = context.activityShape;
  const initBand = context.initBandShape;
  const nonInitBand = context.nonInitBandShape;

  activityShape.businessObject.initiatingParticipantRef = context.initBandShape.businessObject;
  nonInitBand.diBand.participantBandKind = context.nonInitBandKind.split('_')[0] + '_non_initiating';
  initBand.diBand.participantBandKind = context.initBandKind.split('_')[0] + '_initiating';
  this._redraw(context);
};