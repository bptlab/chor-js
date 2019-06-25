/**
 * This handler is evoked when the user links a CallChoreo to a Choreography.
 */
export default function LinkCallChoreoHandler() {}

/**
 * Links the a choreo to a call choreo and un-links the old one if necessary.
 * @param element {businessObject}
 * @param newRef {businessObject} undefined if element should not be linked to anything
 * @returns {*[]}
 */
LinkCallChoreoHandler.prototype.link = function(element, newRef) {
  // we unlink the the element with the old choreo
  if (element.calledChoreographyRef !== undefined) {
    element.calledChoreographyRef.callChoreographyActivity =
      element.calledChoreographyRef.callChoreographyActivity.filter(bo => bo !== element);
  }

  element.calledChoreographyRef = newRef;

  // we link the element with the new referenced choreo
  if (newRef !== undefined) {
    // callChoreographyActivity is not supported by 'moddle' and will not be serialized,
    // but we use it for easier cleanup when a linked choreography is deleted.
    newRef.callChoreographyActivity.push(element);
  }

  return [element];
};

LinkCallChoreoHandler.prototype.preExecute = function(context) {
  if (context.newRef) {
    context.newRef.callChoreographyActivity = context.newRef.callChoreographyActivity || [];
  }
  if (context.element.calledChoreographyRef) {
    context.oldRef = context.element.calledChoreographyRef;
    context.oldRef.callChoreographyActivity = context.oldRef.callChoreographyActivity || [];
  }
  if (context.newRef === context.oldRef) {
    // if the new linked choreo is already linked with this call choreo, we reset the the link.
    context.newRef = undefined;
  }
};


LinkCallChoreoHandler.prototype.execute = function(context) {
  return this.link(context.element, context.newRef);
};

LinkCallChoreoHandler.prototype.revert = function(context) {
  if (context.newRef !== undefined) {
    context.newRef.callChoreographyActivity.pop();
  }
  return this.link(context.element, context.oldRef);
};