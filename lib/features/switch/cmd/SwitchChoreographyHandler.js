export default class SwitchChoreographyHandler {

  constructor(bpmnjs, choreoUtil) {
    this._bpmnjs = bpmnjs;
    this._choreoUtil = choreoUtil;
  }

  preExecute(context) {
    context.previousId = this._choreoUtil.currentChoreography().id;
  }

  execute(context) {
    this._bpmnjs.switch(context.id);
  }

  revert(context) {
    this._bpmnjs.switch(context.previousId);
  }

}

SwitchChoreographyHandler.$inject = [
  'bpmnjs',
  'choreoUtil'
];
