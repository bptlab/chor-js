import { assign } from 'min-dash';
import { getAttachedMessageShape } from '../../../util/MessageUtil';

/**
 * Command to change the initiating participant band of a choreography. Fires on 'band.makeInitiating'.
 */
export default function MakeInitiatingParticipantBandHandler(eventBus, modeling) {
  this._eventBus = eventBus;
  this._modeling = modeling;
}

MakeInitiatingParticipantBandHandler.$inject = [
  'eventBus',
  'modeling'
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

  // When making a band initiating, it was non-initiating before.
  // That means, it potentially does not have a message flow attached to it, which
  // is required for initiating bands. We need to create one for this case.
  if (activityShape.businessObject.messageFlowRef.length < 2) {
    this._modeling.addMessage(bandShape);
    this._modeling.toggleMessageVisibility(bandShape);
  }

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
