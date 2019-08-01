/**
 * This handler is evoked when the user links a CallChoreo to a Choreography.
 * @param modeling {ChoreoModeling}
 * @constructor
 */
export default function LinkCallChoreoHandler(modeling) {
  this._modeling = modeling;
}

LinkCallChoreoHandler.$inject = [
  'modeling'
];

/**
 * Links the call choreo to a choroe.
 * @param element {businessObject}
 * @param newRef {businessObject} undefined if call choreo should not be linked to anything
 * @returns {*[]}
 */
LinkCallChoreoHandler.prototype.link = function(element, newRef) {
  element.calledChoreographyRef = newRef;
  return [element];
};

LinkCallChoreoHandler.prototype.preExecute = function(context) {
  this._modeling.unlinkCallChoreoParticipants(context.element);
  if (context.element.calledChoreographyRef) {
    context.oldRef = context.element.calledChoreographyRef;
  }
  if (context.newRef === context.oldRef) {
    // if the new linked choreo is already linked with this call choreo, we reset the link.
    delete context.newRef;
  }
};


LinkCallChoreoHandler.prototype.execute = function(context) {
  return this.link(context.element, context.newRef);
};

LinkCallChoreoHandler.prototype.revert = function(context) {
  return this.link(context.element, context.oldRef);
};