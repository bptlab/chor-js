export default class SwitchChoreographyHandler {

  constructor(bpmnjs, choreoUtil) {
    this._bpmnjs = bpmnjs;
    this._choreoUtil = choreoUtil;
  }

  preExecute(context) {
    context.previousId = this._choreoUtil.currentChoreography().id;
  }

  execute(context) {
    this._bpmnjs.displayChoreography({ choreoID: context.id });
  }

  revert(context) {
    this._bpmnjs.displayChoreography({ choreoID: context.previousId });
  }

}