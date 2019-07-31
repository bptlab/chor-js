export default class RenameChoreographyHandler {

  constructor(choreoUtil) {
    this._choreoUtil = choreoUtil;
  }

  preExecute(context) {
    context.oldName = this._choreoUtil.currentChoreography().name;
  }

  execute(context) {
    this._choreoUtil.currentChoreography().name = context.newName;
  }

  revert(context) {
    this._choreoUtil.currentChoreography().name = context.oldName;
  }

}

RenameChoreographyHandler.$inject = [
  'choreoUtil'
];