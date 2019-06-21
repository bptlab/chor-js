/**
 *
 */
export default function LinkCallChoreoHandler() {}

/**
 * Links the a choreo to a call choreo and un-links the old one if necessary.
 * @param element {businessObject}
 * @param newLink {businessObject} undefined if element should not be linked
 * @param oldLink {businessObject} undefined if element was not linked
 * @returns {*[]}
 */
LinkCallChoreoHandler.prototype.link = function(element, newLink, oldLink) {
  element.calledChoreographyRef = newLink;
  // we link the element with the new referenced choreo
  if (newLink !== undefined) {
    // callChoreographyActivity is not supported by moddler and will not be serialized,
    // but we use it for easier cleanup when a linked choreography is deleted.
    newLink.callChoreographyActivity.push(element);
  }
  // we unlink the the element with the old choreo
  if (oldLink !== undefined){
    oldLink.callChoreographyActivity = oldLink.callChoreographyActivity.filter(bo => bo !== element);
  }
  return [element];
};

LinkCallChoreoHandler.prototype.preExecute = function(context) {
  if(context.newLink) {
    context.newLink.callChoreographyActivity = context.newLink.callChoreographyActivity || [];
  }
  if (context.newLink === context.oldLink) {
    // if the new linked choreo is already linked with this call choreo, we reset the the link.
    context.newLink = undefined;
  }
};


LinkCallChoreoHandler.prototype.execute = function(context) {
  return this.link(context.element, context.newLink, context.oldLink);
};

LinkCallChoreoHandler.prototype.revert = function(context) {
  if(context.newLink !== undefined){
    context.newLink.callChoreographyActivity.pop();
  }
  return this.link(context.element, context.oldLink, context.newLink);
};