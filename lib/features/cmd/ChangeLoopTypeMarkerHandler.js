/**
 * Command handler that fires on `loopType.add` and adds a Standard loop type marker
 */
export default function ChangeLoopTypeMarkerHandler(eventBus) {
  this._eventBus = eventBus;
}

ChangeLoopTypeMarkerHandler.$inject = [
  'eventBus'
];

ChangeLoopTypeMarkerHandler.prototype.execute = function(context) {
  context.activityShape.businessObject.loopType = context.newMarker;
  this._eventBus.fire('element.changed', {
    element: context.activityShape
  });
};

ChangeLoopTypeMarkerHandler.prototype.revert = function(context) {
  context.activityShape.businessObject.loopType = context.currentMarker;
  this._eventBus.fire('element.changed', {
    element: context.activityShape
  });
};