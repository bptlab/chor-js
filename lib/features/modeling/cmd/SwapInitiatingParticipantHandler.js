import { assign } from 'min-dash';
import { is } from 'bpmn-js/lib/util/ModelUtil';
import { getAttachedMessageShape } from '../../../util/MessageUtil';
import { isInitiating } from '../../../util/BandUtil';

/**
 * Command to change the initiating participant band of a choreography. Fires on 'band.swapInitiatingParticipant'.
 * @constructor
 * @param {EventBus} eventBus
 * @param {ChoreoModeling} modeling
 *
 */
export default function SwapInitiatingParticipantHandler(eventBus, modeling) {
  this._eventBus = eventBus;
  this._modeling = modeling;
}

SwapInitiatingParticipantHandler.$inject = [
  'eventBus',
  'modeling'
];

SwapInitiatingParticipantHandler.prototype._redraw = function(context) {
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

SwapInitiatingParticipantHandler.prototype.preExecute = function(context) {
  // The logic of this handler is built around making a non-initiating participant
  // initiating. If we want to do the opposite, we just swap them in the context.
  // This will only work for choreography tasks.
  let bandShape = context.bandShape;
  const activityShape = bandShape.parent;
  if (is(activityShape, 'bpmn:ChoreographyTask')) {
    if (isInitiating(bandShape)) {
      bandShape = activityShape.children.find(x => x !== bandShape);
    }

    // When making a band initiating, it was non-initiating before.
    // That means, it potentially does not have a message flow attached to it, which
    // is required for initiating bands. We need to create one for this case.
    if (is(activityShape, 'bpmn:ChoreographyTask')) {
      if (activityShape.businessObject.messageFlowRef.length < 2) {
        this._modeling.addMessage(bandShape);
        this._modeling.toggleMessageVisibility(bandShape);
      }
    }
  }

  context.nonInitBandShape = bandShape;
  const initParticipantBand = activityShape.children.find(
    x => x.businessObject === activityShape.businessObject.initiatingParticipantRef);

  assign(context, {
    activityShape: activityShape,
    initBandShape: initParticipantBand,
    nonInitBandKind: bandShape.diBand.participantBandKind,
    initBandKind: initParticipantBand.diBand.participantBandKind
  });
};

SwapInitiatingParticipantHandler.prototype.execute = function(context) {
  const activityShape = context.activityShape;
  const initBandShape = context.initBandShape;
  const nonInitBandShape = context.nonInitBandShape;

  activityShape.businessObject.initiatingParticipantRef = context.nonInitBandShape.businessObject;
  nonInitBandShape.diBand.participantBandKind = context.nonInitBandKind.split('_')[0] + '_initiating';
  initBandShape.diBand.participantBandKind = context.initBandKind.split('_')[0] + '_non_initiating';
  this._redraw(context);
};

SwapInitiatingParticipantHandler.prototype.revert = function(context) {
  const activityShape = context.activityShape;
  const initBand = context.initBandShape;
  const nonInitBand = context.nonInitBandShape;

  activityShape.businessObject.initiatingParticipantRef = context.initBandShape.businessObject;
  nonInitBand.diBand.participantBandKind = context.nonInitBandKind.split('_')[0] + '_non_initiating';
  initBand.diBand.participantBandKind = context.initBandKind.split('_')[0] + '_initiating';
  this._redraw(context);
};
