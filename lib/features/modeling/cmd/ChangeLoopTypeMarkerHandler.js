/**
 * Command handler that fires on `activity.changeLoopType` and
 * changes the loop type of an activity.
 */
export default function ChangeLoopTypeMarkerHandler(eventBus) {
  this._eventBus = eventBus;
}

ChangeLoopTypeMarkerHandler.$inject = [
  'eventBus'
];

ChangeLoopTypeMarkerHandler.prototype.execute = function(context) {
  context.activityShape.businessObject.loopType = context.newLoopType;
  this._eventBus.fire('element.changed', {
    element: context.activityShape
  });
};

ChangeLoopTypeMarkerHandler.prototype.revert = function(context) {
  context.activityShape.businessObject.loopType = context.oldLoopType;
  this._eventBus.fire('element.changed', {
    element: context.activityShape
  });
};