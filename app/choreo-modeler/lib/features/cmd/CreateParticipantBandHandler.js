/**
 * Command handler that fires on `band.delete` and `band.create`.
 */
export default function CreateParticipantBandHandler(commandStack, elementRegistry, eventBus) {
  this._commandStack = commandStack;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
}

CreateParticipantBandHandler.$inject = [
  'commandStack',
  'elementRegistry',
  'eventBus'
];

CreateParticipantBandHandler.prototype.deleteBand = function(activityShape, index) {
  console.log(activityShape, index);
}

CreateParticipantBandHandler.prototype.createBand = function(activityShape, index, isInitiating, isMessageVisible) {
  console.log(activityShape, index, isInitiating, isMessageVisible);
}

CreateParticipantBandHandler.prototype.execute = function(context) {
  if (context.delete) {
    this.deleteBand(context.activityShape, context.index);
  } else {
    this.createBand(context.activityShape, context.index, context.isInitiating, context.isMessageVisible);
  }
};

CreateParticipantBandHandler.prototype.revert = function(context) {
  if (context.delete) {
    this.createBand(context.activityShape, context.index, context.isInitiating, context.isMessageVisible);
  } else {
    this.deleteBand(context.activityShape, context.index);
  }
};